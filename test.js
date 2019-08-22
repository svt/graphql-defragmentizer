const { print } = require('graphql/language/printer');

const { createFragment, createQuery } = require('./index.js');

it('works', () => {
    const buttonFragment = createFragment`
      ... on Button {
        id
    }`;

    const imageFragment = createFragment`
      ... on Image {
          id
          button {
              ...${buttonFragment} 
          }
      }`;

    const query = createQuery`
    query Test {
        id
        image {
            ...${imageFragment}
        }
        
    }`;

    const expected = `\
query Test {
  id
  image {
    ...fragment_paqd3t
  }
}

fragment fragment_paqd3t on Image {
  id
  button {
    ...fragment_rqt2wq
  }
}

fragment fragment_rqt2wq on Button {
  id
}
`;

    expect(print(query)).toBe(expected);
});

it('generates same fragment names every time', () => {
    const firstFragment = createFragment`
          ... on Button {
            id
        }`;
    const secondFragment = createFragment`
          ... on Button {
            id
        }`;
    const firstQuery = createQuery`
    query Test {
        id
        image {
            ...${firstFragment}
        }
        
    }`;
    const secondQuery = createQuery`
    query Test {
        id
        image {
            ...${secondFragment}
        }
        
    }`;

    expect(print(firstQuery)).toBe(print(secondQuery));
});

it('generates different fragment names with different child fragments', () => {
    const firstChild = createFragment`
      ... on Thing {
        id
      }
    `;
    const secondChild = createFragment`
      ... on OtherThing {
        id
      }
    `;
    const firstFragment = createFragment`
      ... on Button {
        field {
          ...${firstChild}
        }
      }
    `;
    const secondFragment = createFragment`
      ... on Button {
        field {
          ...${secondChild}
        }
      }
    `;
    expect(firstFragment.name).not.toBe(secondFragment.name);
});

it('generates different fragment names when only type differs', () => {
    const firstFragment = createFragment`
      ... on OneThing {
        field1
        field2
      }
    `;
    const secondFragment = createFragment`
      ... on OtherThing {
        field1
        field2
      }
    `;
    expect(firstFragment.name).not.toBe(secondFragment.name);
});

it('doesnt output identical fragments multiple times', () => {
    const firstFragment = createFragment`
          ... on Button {
            id
        }`;
    const secondFragment = createFragment`
          ... on Button {
            id
        }`;
    const query = createQuery`
    query Test {
        id
        image {
            ...${firstFragment}
        }
        button {
            ...${secondFragment}
        }
    }`;

    expect(
        print(query).match(new RegExp('fragment ' + firstFragment.name, 'g'))
            .length
    ).toBe(1);
});

it('can create a plain text query', () => {
    expect(print(createQuery`query Foo { name }`)).toBe(
        `query Foo {
  name
}
`
    );
});

it('can interleave strings and numbers in query', () => {
    const query = createQuery`query Things { thing(foo: ${12}, bar: "${'baz'}") }`;
    expect(print(query)).toBe(`query Things {
  thing(foo: 12, bar: "baz")
}
`);
});

it('can interleave strings and numbers in fragments', () => {
    const fragment = createFragment`... on Thing { hello(where: "${'world'}", amount: ${42}) }`;
    const query = createQuery`query Things { thing { ...${fragment} }}`;
    expect(print(query)).toBe(`query Things {
  thing {
    ...fragment_uiclhv
  }
}

fragment fragment_uiclhv on Thing {
  hello(where: "world", amount: 42)
}
`);
});
