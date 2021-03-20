/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

require('dotenv').config({
  path: `.env`
});

module.exports = {
  siteMetadata: {
    title: `Clover Store`,
    description: `This is a WIP.`,
    siteUrl: 'https://TBD.com',
    author: `Max Kendall`,
    keywords: ['work in progress', 'test'],
    email: 'youremail@yourdomain.com',
    tagLine: 'Great description of products and stuff',
    pages: [
      {
        name: 'Page 2',
        link: '/page-2/'
      },
      {
        name: 'Parent Page',
        isExpandable: true,
        childPages: [
          {
            name: 'Page 3',
            link: '/page-3/'
          },
          {
            name: 'Page 4',
            link: '/page-4/'
          }
        ]
      },
    ],
  },
  plugins: [
    // styles
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        implementation: require("node-sass"),
        postCssPlugins: [
          require("tailwindcss"),
          // Optional: Load custom Tailwind CSS configuration
          require("./tailwind.config.js")
        ],
      },
    },
    // SEO
    `gatsby-plugin-react-helmet`,
    // Image Processing
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/images/`,
      },
    },
    // for exposing the shopify storefront api
    {
      resolve: "gatsby-source-shopify-local",
      options: {
        url: `https://${process.env.SHOP_NAME}.com/api/2020-04/graphql`,
        headers: {
          'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
    },
    // {
    // resolve: "gatsby-source-shopify",
    //   options: {
    //     // The domain name of your Shopify shop. This is required.
    //     // Example: 'gatsby-source-shopify-test-shop' if your Shopify address is
    //     // 'gatsby-source-shopify-test-shop.myshopify.com'.
    //     // If you are running your shop on a custom domain, you need to use that
    //     // as the shop name, without a trailing slash, for example:
    //     // shopName: "gatsby-shop.com",
    //     shopName: process.env.SHOP_NAME,

    //     // An API access token to your Shopify shop. This is required.
    //     // You can generate an access token in the "Manage private apps" section
    //     // of your shop's Apps settings. In the Storefront API section, be sure
    //     // to select "Allow this app to access your storefront data using the
    //     // Storefront API".
    //     // See: https://help.shopify.com/api/custom-storefronts/storefront-api/getting-started#authentication
    //     accessToken: process.env.SHOPIFY_ACCESS_TOKEN,

    //     // Set the API version you want to use. For a list of available API versions,
    //     // see: https://help.shopify.com/en/api/storefront-api/reference/queryroot
    //     // Defaults to 2019-07
    //     apiVersion: "2020-01",

    //     // Set verbose to true to display a verbose output on `npm run develop`
    //     // or `npm run build`. This prints which nodes are being fetched and how
    //     // much time was required to fetch and process the data.
    //     // Defaults to true.
    //     verbose: true,

    //     // Number of records to fetch on each request when building the cache
    //     // at startup. If your application encounters timeout errors during
    //     // startup, try decreasing this number.
    //     paginationSize: 250,

    //     // List of collections you want to fetch.
    //     // Possible values are: 'shop' and 'content'.
    //     // Defaults to ['shop', 'content'].
    //     includeCollections: ["Originals Shop", "Prints Shop"],
    //     // Download Images Locally
    //     // set to false if you plan on using shopify's CDN
    //     downloadImages: true,

    //     // Allow overriding the default queries
    //     // This allows you to include/exclude extra fields when sourcing nodes
    //     // Available keys are: articles, blogs, collections, products, shopPolicies, and pages
    //     // Queries need to accept arguments for first and after
    //     // You will need to include all the fields you want available for a
    //     // specific key. View the `shopifyQueries Defaults` section below for a
    //     // full list of keys and fields.
    //   }
    // },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: "gatsby-ecommerce-starter",
        short_name: "ecommerce",
        start_url: "/",
        background_color: "#6b37bf",
        theme_color: "#6b37bf",
        // Enables "Add to Homescreen" prompt and disables browser UI (including back button)
        // see https://developers.google.com/web/fundamentals/web-app-manifest/#display
        display: "standalone",
        icon: "src/images/logo.png", // This path is relative to the root of the site.
        // An optional attribute which provides support for CORS check.
        // If you do not provide a crossOrigin option, it will skip CORS for manifest.
        // Any invalid keyword or empty string defaults to `anonymous`
        crossOrigin: `use-credentials`,
      }
    },
  ]
};

