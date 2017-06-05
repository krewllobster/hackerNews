import React, { Component } from 'react';
import fetch from 'isomorphic-fetch';
import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
import './App.css';

const FontAwesome = require('react-fontawesome');

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
};

const DEFAULT_QUERY = 'redux';
const DEFAULT_PAGE = 0;

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      isLoading: false,
      sortKey: 'NONE',
      isSortReverse: false,
    };

    this.needsToSearchTopstories = this.needsToSearchTopstories.bind(this);
    this.setSearchTopstories = this.setSearchTopstories.bind(this);
    this.fetchSearchTopstories = this.fetchSearchTopstories.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  }

  setSearchTopstories(result) {
    const { hits, page } = result;
    const { searchKey, results } = this.state;

    const oldHits = results && results[searchKey]
      ? results[searchKey].hits
      : [];

    const updatedHits = [...oldHits, ...hits];

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page},
      },
      isLoading: false,
    })
  }

  needsToSearchTopstories(searchTerm) {
    return !this.state.results[searchTerm];
  }

  fetchSearchTopstories(searchTerm, page) {
    this.setState({ isLoading: true });

    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}`)
      .then(response => response.json())
      .then(result => this.setSearchTopstories(result));
  }

  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm })
    this.fetchSearchTopstories(searchTerm, DEFAULT_PAGE);
  }

  onDismiss(id) {
    const {searchKey, results} = this.state;
    const {hits, page} = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page}
      }
    })
  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value});
  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopstories(searchTerm)) {
      this.fetchSearchTopstories(searchTerm, DEFAULT_PAGE);
    }

    event.preventDefault();
  }

  render() {
    const {
      searchTerm,
      results,
      searchKey,
      isLoading,
      sortKey,
      isSortReverse
    } = this.state;

    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;

    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];

    return (
      <div className="page">
        <div className="interactions">
          <Search
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          >Search</Search>
          {results &&
            <Table
              hits={list}
              sortKey={sortKey}
              isSortReverse={isSortReverse}
              onSort={this.onSort}
              onDismiss={this.onDismiss}
            />
          }
          <div className="interactions">
            <ButtonWithLoading
              isLoading={isLoading}
              onClick={() => this.fetchSearchTopstories(searchTerm, page + 1)}>
              More
            </ButtonWithLoading>
          </div>
        </div>
      </div>
    );
  }
}

const Loading = () => (
  <div>
    <FontAwesome
      name="spinner"
      size="3x"
      spin
    />
  </div>
)

const Button = ({onClick, className, children}) => (
  <button
    onClick = {onClick}
    className = {className}
    type = "button"
  >
    {children}
  </button>
)

const withLoading = (Component) => ({isLoading, ...rest}) => (
  isLoading ? <Loading /> : <Component { ...rest} />
)

const ButtonWithLoading = withLoading(Button);

const Search = ({ value, onChange, onSubmit, children}) => (
  <form onSubmit = {onSubmit}>
    <input
      type="text"
      value = {value}
      onChange = {onChange}
    />
    <button type="submit">
      {children}
    </button>
  </form>
)

Search.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  children: PropTypes.node,
}

const Sort = ({ sortKey, onSort, children}) => (
  <Button
    onClick={() => onSort(sortKey)}
    className="button-inline"
  >
    {children}
  </Button>
)

const Table = ({
  hits,
  onDismiss,
  sortKey,
  isSortReverse,
  onSort
}) => {
  const largeColumn = {width: '40%'};
  const midColumn = {width: '30%'};
  const smallColumn = {width: '10%'};
  const sortedHits = SORTS[sortKey](hits);
  const reverseSortedHits = isSortReverse
    ? sortedHits.reverse()
    : sortedHits;

  return (
    <div className="table">
      <div className = "table-header">
        <span style={largeColumn}>
          <Sort
            sortKey={'TITLE'}
            onSort={onSort}
            activeSortKey={sortKey}
          >
            Title
          </Sort>
        </span>
        <span style={midColumn}>
          <Sort
            sortKey={'AUTHOR'}
            onSort={onSort}
            activeSortKey={sortKey}
          >
            Author
          </Sort>
        </span>
        <span style={smallColumn}>
          <Sort
            sortKey={'COMMENTS'}
            onSort={onSort}
            activeSortKey={sortKey}
          >
            Comments
          </Sort>
        </span>
        <span style={smallColumn}>
          <Sort
            sortKey={'POINTS'}
            onSort={onSort}
            activeSortKey={sortKey}
          >
            Points
          </Sort>
        </span>
        <span style={smallColumn}>
          Archive
        </span>
      </div>
      {reverseSortedHits.map(item =>
        <div key={item.objectID} className="table-row">
          <span style={largeColumn}>
            <a href={item.url} target="_blank">{item.title}</a>
          </span>
          <span style={midColumn}>{item.author}</span>
          <span style={smallColumn}>{item.num_comments}</span>
          <span style={smallColumn}>{item.points}</span>
          <span style={smallColumn}>
            <Button
              onClick={() => onDismiss(item.objectID)}
              className="button-inline"
            >
              Dismiss
            </Button>
          </span>
        </div>
    )}
    </div>
  );
}

Table.propTypes = {
  hits: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number,
    })
  ).isRequired,
  onDismiss: PropTypes.func,
}

Button.defaultProps = {
  className: '',
};

Button.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
}

export default App;

export {
  Button,
  Search,
  Table,
}
