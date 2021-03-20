import { useStaticQuery, graphql } from 'gatsby';
import { getResponsiveImages } from './img';

export const useProducts = () => {
    const { allShopifyProduct: { nodes: products } } = useStaticQuery(
        graphql`
            query getAllProducts {
                allShopifyProduct {
                    nodes {
                        productType
                        handle
                        totalInventory
                        variants {
                            id
                            localFile {
                                small: childImageSharp {
                                    fixed(width: 300) {
                                        ...GatsbyImageSharpFixed
                                    }
                                }
                                medium: childImageSharp {
                                    fixed(width: 500) {
                                        ...GatsbyImageSharpFixed
                                    }
                                }
                                large: childImageSharp {
                                    fixed(width: 700) {
                                        ...GatsbyImageSharpFixed
                                    }
                                }
                            }
                            price
                            availableForSale
                            title
                        }
                        priceRange {
                            high
                            low
                        }
                        collection
                        title
                        slug
                    }
                }
            }  
        `
    );
    return products;
};

export const useAllPrints = () => {
    return useProducts()
        .filter(({ productType }) => productType.toLowerCase() === 'print');
}

export const useAllProducts = () => {
    return useProducts();
};

export const getDefaultProductImage = (product, imgType = "fixed") => {
    // Considering the most expensive variant to be the default. 
    const defaultImg = product.variants
        .concat([{ localFile: product.localFile, isProductImg: true }])
        .filter(({ localFile }) => localFile)
        .reduce((acc, img) => {
            if (!acc) return img;
            if (img.isProductImg) return img;
            return acc;
        }, null);
    if (defaultImg && defaultImg.localFile) {
        return getResponsiveImages({
            img: defaultImg.localFile
        }, imgType)
        .responsiveImgs;
    }
    return null;
}

export const getPrettyPrice = (num) => {
    if (!num) return `$0.00`;
    const cleanNumber = typeof num === 'number'
        ? `${num.toFixed(2)}`
        : `${parseInt(num, 10).toFixed(2)}`;
    if (cleanNumber.split('.')[0].length <= 3) return `$${cleanNumber}`;
    if (cleanNumber.split('.')[0].length <= 4) return `$${cleanNumber.substring(0,1)},${cleanNumber.substr(1)}`;
    if (cleanNumber.split('.')[0].length <= 5) return `$${cleanNumber.substring(0,2)},${cleanNumber.substr(2)}`;
    // selling paintings for 100K? Noice.
    return cleanNumber;
}

export const getAfterPaySingleInstallment = (price) => {
    return getPrettyPrice(price / 4);
};
