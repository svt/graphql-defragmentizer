
# graphql-defragmentizer

*Library for building [GraphQL](https://github.com/graphql/graphql-js) queries
from fragments in JavaScript.*

It combines the main query, the fragments and their sub-fragments into one
valid query. Useful for React apps, if you want each component to specify
its own data requirements, but still want to run a single GraphQL query.

It can be used on React components in a way similar to [`prop-types`](https://github.com/facebook/prop-types)
declarations.

There's no dependency on React and can be used by all kinds of GraphQL clients.

### Status

We're using it in production at [SVT](https://www.svt.se/opensource/) and will likely fix problems if we encounter any.
[Contributions](CONTRIBUTING.md) are welcome!  

## API

### `` createQuery`...` ``

Creates a GraphQL `Document` from a template string.

Values are usually fragments (created by `createFragment`). Fragments must be placed where
you would normally place the _name_ of a fragment.

If the values aren't fragments, they'll be appended to the query (with `String()` conversion).

The query and the fragments (and their sub-fragments) will be recursively combined into a
valid GraphQL query, combining any duplicate fragments into one.

If you don't use fragments, it's mostly identical to the `` gql`...` `` function
of [`graphql-tag`](https://github.com/apollographql/graphql-tag).

Usage:

    const query = createQuery`
      query MyQuery {
        someQuery {
          ... ${myFragment}
        }
      }`;

### `` createFragment`...` ``

Creates a fragment from a template string, for use by `createQuery` or a parent `createFragment` call.

The template string must be a valid GraphQL fragment definition, but without the _name_. It can have
other fragments as values.

If the values aren't fragments, they'll be appended to the fragment (with `String()` conversion).

Usage:

    const fragment = createFragment`
      ... on MyThing {
        name
        friends {
          ... ${friendFragment}
        }
      }`;

## Example with React

Showing a latest news list on a web page:

Main.js:

    import { createQuery } from 'graphql-defragmentizer';
    import { graphql } from 'react-apollo';

    const MainQuery = createQuery`
      query MainQuery {
        main {
          latestNews {
            ...${LatestNews.fragments.latestNews}
          }
          mainTitle
        }
      }
    `;

    function Main({ mainTitle, latestNews }) {
        return
          <div>
            <h1>{mainTitle}</h1>
            <p><LatestNews latestNews={latestNews} /></p>
          </div>
    }

    export default graphql(MainQuery,
      props: props => ({
        latestNews: props.data.main.latestNews,
        mainTitle: props.data.main.mainTitle 
      })
    )(Main);

LatestNews.js:
    
    import { createFragment } from 'graphql-defragmentizer';

    export default function LatestNews({ latestNews }) {
      return latestNews.map((item) => {
         <a href={url}>{title}</a>
      }
    }

    LatestNews.fragments = {
      latestNews: createFragment`
        ... on LatestNewsItem {
          title
          url
        }
      `
    };
    
This would build a query like this:

    query MainQuery {
      main {
        latestNews {
          ...fragment_fevfrc
        }
        mainTitle
      }
    }
    
    fragment fragment_fevfrc on LatestNewsItem {
      title
      url
    }

The name "fragment_fevfrc" is created by hashing the contents and type of the
fragment, so two identical fragments will be merged into one.

## License

Copyright (c) 2019 Sveriges Television AB.

graphql-defragmentizer is released under the [MIT License](LICENSE).

## Getting involved

Feel free to issue pull requests or file issues. For more details, see [CONTRIBUTING](CONTRIBUTING.md) 

## Primary Maintainer

Anders Kindberg [https://github.com/ghostganz](https://github.com/ghostganz)

## Credits

Original implementation by [Emil Broman](https://github.com/emilniklas).
