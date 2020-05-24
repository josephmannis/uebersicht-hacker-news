import { styled, css } from 'uebersicht';

export const refreshFrequency = 1.8e6; // 30m

const scrollbar = `
  /* width */
  ::-webkit-scrollbar {
    width: 17px;

  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: rgba(136, 136, 136, .23);
    border-radius: 1em;
    margin: 1em 0;
    border: 5px solid white;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    transition: all .1s ease-in-out;
    background: #555;
  }
`

export const className = `
  right: 2em;
  top: 2em;
  font-family: -apple-system;
  z-index: 1;

  border-radius: 14px;
  background-color: white;
  opacity: 88%;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5em 2em;
  font-family: Avenir;
  width: 20%;
  max-height: 50%;
  overflow: auto;
  ${scrollbar};
`;

const PROXY = 'http://127.0.0.1:41417/';

const api = async query => await fetch (new URL(`${PROXY}https://hacker-news.firebaseio.com/v0/${query}`));

const fetchStoriesInRange = async(start, end) => {
  const response = await api('topstories.json');
  if (!response.ok) {
    throw Error(`${response.status} ${response.statusText}`);
  }
  const storyIds = await response.json();
  return await Promise.all(
      storyIds.slice(start, end).map(async id => {
          const itemResponse = await api(`item/${id}.json`);
          if (!itemResponse.ok) {
            throw Error(`${itemResponse.status} ${itemResponse.statusText}`);
          }
          return await itemResponse.json();
      })
  );
}

const getStoriesForPage = async (pageNumber) => {
  let storiesPerPage = 10;
  let end = pageNumber * storiesPerPage; 
  return fetchStoriesInRange(end - storiesPerPage, end);
}

export const initialState = {
  output: 'Fetching...',
  page: 1,
}

export const command = async dispatch => {
  getStoriesForPage(initialState.page)
    .then(data => dispatch({ type: 'FETCH_SUCCEEDED', data: data}))
    .catch(err => dispatch({ type: 'FETCH_FAILED', error: err}));
};

export const updateState = (event, previousState) => {
    switch (event.type) {
        case 'FETCH_SUCCEEDED': return { data: event.data, page: previousState.page };
        case 'FETCH_FAILED': return { error: event.error.message };
        case 'UPDATE_PAGE': return { data: [], page: event.page };
        default: return previousState;
    }
};

const TopStoriesList = styled.ul`
    list-style-type: none;
    line-height: 1.5rem;
    margin: 0;
    margin-top: 1em;
    padding: 0;
`;

const a = css`
    color: darkgray;
    text-decoration: none;
`;

const DiscussionLink = styled.a`
  color: lightgray;
  text-decoration: none;
  font-size: 1em;
  opacity: 50%;
`;

const H1 = styled.h1`
  margin: 0;
  & a {
    color: black;
    text-decoration: none;
  }
`

const Divider = styled.div`
  width: 100%;
  margin: 1em 0;
  border-bottom: .5px solid gray;
`

const makeItemLink = id => `https://news.ycombinator.com/item?id=${id}`;

const StoryLink = ({ id, title, url}) => {
    const link = url ? url : makeItemLink(id);
    const host = ` (${(new URL(link)).hostname})`;
    return (
        <div>
          <a className={a} href={link}>{`${title}${host}`}</a>
          <DiscussionLink href={makeItemLink(id)}>{' 🗣'}</DiscussionLink>
        </div>
    );
};

const TopStory = ({id, title, url}) => (
    <li>
        <StoryLink title={title} url={url} id={id}/>
    </li>
);

const row = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TickerButton = styled.button`
  border: none;
  background-color: transparent;
  padding: 0 .5em;
  color: lightgray;
  font-weight: bolder;
  font-size: 1em;
`

const PageTicker = ({currentPage, onPageChanged}) => (
  <div className={row}>
    {currentPage !== 1 && 
    <TickerButton onClick={() => onPageChanged(currentPage - 1)}>{'–'}</TickerButton>}
    {currentPage}
    <TickerButton onClick={() => onPageChanged(currentPage + 1)}>{'+'}</TickerButton>
  </div>
)

const onPageChanaged = (page, dispatch) => {
  dispatch({type: 'UPDATE_PAGE', page: page}); 
  getStoriesForPage(page)
  .then(data => {
    dispatch({ type: 'FETCH_SUCCEEDED', data: data})
  })
  .catch(err => dispatch({ type: 'FETCH_FAILED', error: err}));
}

export const render = ({ data = [], error = '', page }, dispatch) => (
  error ? (
    <div>
      {`Error retrieving: ${error}`}
    </div>
  ) : (
    <div>
      <div className={row}>
        <H1><a href={"https://news.ycombinator.com/"}>Hackernews</a></H1>
        <PageTicker currentPage={page} onPageChanged={(page) => onPageChanaged(page, dispatch)}/>
      </div>
    <TopStoriesList>
      {data.map((item, i) => {
        return(
          <div key={i}>
            <TopStory key={item.id} {...item} />
            <Divider/>
          </div>
        )
      })}
    </TopStoriesList>
    </div>
  )
);
