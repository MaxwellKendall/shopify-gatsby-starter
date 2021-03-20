import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/Layout';
import ShopGrid from '../components/ShopGrid';

export default ({
    location
}) => {
    console.log('hello?')
    return (
        <Layout classNames="sqrl-grey" location={location}>
            {/* <ShopGrid products={originals} path={location.pathname} /> */}
            <p>HI</p>
        </Layout>
    );
}

// export const query = graphql`
//     query GetOnlyOriginals {
//         allShopifyProduct(filter: {collection: {eq: "Originals Shop"}}) {
//             nodes {
//                 optimizedImages
//                 title
//                 collection
//                 slug
//                 productType
//                 priceRange {
//                     high
//                     low
//                 }
//                 variants {
//                     image
//                     availableForSale
//                     localFile {
//                         small: childImageSharp {
//                             fixed(width: 300) {
//                                 ...GatsbyImageSharpFixed
//                             }
//                         }
//                         medium: childImageSharp {
//                             fixed(width: 500) {
//                                 ...GatsbyImageSharpFixed
//                             }
//                         }
//                         large: childImageSharp {
//                             fixed(width: 700) {
//                                 ...GatsbyImageSharpFixed
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     }    
// `
