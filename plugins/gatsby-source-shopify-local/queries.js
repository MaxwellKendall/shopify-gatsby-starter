const { gql } = require('@apollo/client');

// const productFragment = gql`
//     fragment productFragment on Product {
//         createdAt
//         id
//         title
//         handle
//         description
//         productType
//         availablePublicationCount
//         id
//         tracksInventory
//         totalInventory
//         seo {
//             description
//             title
//         }
//         featuredImage {
//             id
//             originalSrc
//             transformedSrc
//         }
//         priceRange {
//         maxVariantPrice {
//             amount
//             currencyCode
//         }
//         minVariantPrice {
//             amount
//             currencyCode
//         }
//     }
// `;
  
// const collectionFragment = gql`
//     fragment collectionFragment on Collection {
//         productsCount
//         publicationCount
//         handle
//         description
//         image {
//             id
//         }
//         seo {
//             description
//             title
//         }
//         products(first: $first) {
//             edges {
//                 node {
//                     ...productFragment   
//                 }
//             }
//         }
//     }
// `;

// const variantFragment = gql`
//  fragment variantFragment on ProductVariant {
//     defaultCursor
//     displayName
//     presentmentPrices(first: $first) {
//       edges {
//         node {
//           price {
//             amount
//             currencyCode
//           }
//         }
//       }
//     }
//     weight
//     weightUnit
//     sku
//     taxCode
//     taxable
//     selectedOptions {
//       name
//       value
//     }
//     id
//     availableForSale
//     image {
//       id
//       originalSrc
//       transformedSrc
//       altText
//     }
//   }
// `;
  
// exports.GetAllProducts = gql`
//     query GetProducts($first: Int!) {
//         products(first: $first) {
//         edges {
//             cursor
//             node {
//                 ...productFragment
//             }
//         }
//         }
//     }
// `;

// exports.GetVariantsById = gql`
//   query GetVariantsById($id: ID!, $first: Int) {
//     productVariant(id: $id) {
//       ...variantFragment
//   }
// `;

exports.GetAllProductsInCollection = gql`
    query GetAllProductsInCollection($first: Int!, $handle: String!) {
        collectionByHandle(handle: $handle) {
            handle
            description
            id
            title
            image {
                id
                originalSrc
            }
            products(first: $first) {
                edges {
                    cursor
                    node {
                        createdAt
                        id
                        title
                        handle
                        description
                        productType
                        id
                        totalInventory
                        tags
                        images(first: $first) {
                            edges {
                                node {
                                    originalSrc
                                }
                            }
                        }
                        variants(first:$first) {
                      	  edges {
                      	    node {
                              price
                              sku
                              weight
                              weightUnit
                              title
                      	      id
                              availableForSale
                              image {
                                altText
                                originalSrc
                              }
                      	    }
                      	  }
                      	}
                        priceRange {
                            maxVariantPrice {
                                amount
                                currencyCode
                            }
                            minVariantPrice {
                                amount
                                currencyCode
                            }
                        }
                    }
                }
            }
        }
    }   
`;

exports.GetAllCollections = gql`
    query GetAllCollections($first: Int!) {
        collections(first: $first) {
            pageInfo {
                hasNextPage
                hasPreviousPage
            }
            edges {
                node {
                    handle
                }
            }
        }
    }
`;

// exports.GetAllCollectionsAndAllProducts = gql`
//     query GetAllCollectionsAndProducts($first: Int!) {
//         collections(first: $first) {
//             pageInfo {
//                 hasNextPage
//                 hasPreviousPage
//             }
//             edges {
//                 node {
//                 ...collectionFragment
//                 products(first: $first) {
//                     pageInfo {
//                     hasNextPage
//                     hasPreviousPage
//                     }
//                     edges {
//                     node {
//                         ...productFragment
//                     }
//                     }
//                 }
//                 }
//             }
//         }
//     }
// `;