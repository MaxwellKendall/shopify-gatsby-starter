import { fetchProductInventory } from "../../client";
import { getResponsiveImages } from "./img";

export const getParsedVariants = (arr, title) => arr.map((variant) => ({
    ...variant,
    title: variant.title === 'Default Title' ? title : variant.title
}));

export const localStorageKey = `ckendallart-checkout`;

export const getCheckoutIdFromLocalStorage = (window) => {
    if (!window) return null
    return window.localStorage.getItem(localStorageKey);
};

export const getImages = (selectedVariantIds, products) => {
    return products
        .filter((product) => {
            return product.variants.some((variant) => selectedVariantIds.includes(variant.id))
        })
        .reduce((acc, product) => {
            const selectedProductVariants = product.variants.filter((variant) => selectedVariantIds.includes(variant.id));
            return selectedProductVariants.reduce((nestedAcc, variant) => {
                return {
                    ...nestedAcc,
                    [variant.id]: getResponsiveImages({ img: variant.localFile })
                };
            }, acc);
        }, {});
}

const keysAndPathsForCustomAttributes = [
    ['productId', 'productId'],
    ['pricePerUnit', 'selectedVariant.price'],
    ['productTitle', 'title'],
    ['variantTitle', 'selectedVariant.title'],
    ['handle', 'handle'],
    ['collection', 'productType']
];
/**
 * @param data { ...shopifyProduct, variant: shopifyVariant }
 * @returns an array of objects { key: nameOfKey, value: valueForKey }
*/
export const addCustomAttributesToLineItem = (data) => {
    return keysAndPathsForCustomAttributes.reduce((acc, [key, path]) => {
        const value = path.split('.').reduce((acc, prop) => {
            return acc[prop];
        }, data);
        return acc.concat([{
            key,
            value
        }]);
    }, []);
};

export const parseLineItemsFromRemoteCart = (cart, additionalCustomAttributes = []) => {
    return cart.lineItems.map((item) => ({
        variantId: item.variant.id,
        quantity: item.quantity,
        customAttributes: item.customAttributes.some((attr) => attr.key === 'lineItemId')
            ? item.customAttributes
            : item.customAttributes.concat([{ key: 'lineItemId', value: item.id }])
    }))
};

export const parseDataFromRemoteCart = (cart, products) => {
    const {
        id,
        totalPrice,
        totalTax,
        webUrl
    } = cart;

    const lineItems = parseLineItemsFromRemoteCart(cart);

    return {
        id,
        lineItems,
        totalPrice,
        totalTax,
        webUrl,
        lineItems,
        imagesByVariantId: getImages(lineItems.map((item) => item.variantId), products)
    };
};

export const getLineItemForAddToCart = (product, quantity) => [{
    variantId: product.selectedVariant.id,
    quantity,
    customAttributes: addCustomAttributesToLineItem(product)
}];

export const getCustomAttributeFromCartByVariantId = (lineItems, variantId, key) => {
    return lineItems
        .find((item) => item.variantId === variantId)
        .customAttributes
        .find((attr) => attr.key === key)
        .value;
}

export const isVariantInCart = (cart, variantId) => cart.lineItems.some((item) => item.variantId === variantId);

export const getLineItemForUpdateToCart = (lineItems, variantId) => {
    const lineItem = lineItems.find((item) => item.variantId === variantId);
    const lineItemId = getCustomAttributeFromCartByVariantId([lineItem], variantId, 'lineItemId');
    return { quantity: lineItem.quantity, id: lineItemId };
};

export const getInventoryDetails = (variantId, cart) => {
    return fetchProductInventory(variantId)
        .then((remoteQuantity) => {
            const heldQuantity = cart.lineItems.find((item) => item.variantId === variantId)?.quantity || 0;
            return [remoteQuantity, remoteQuantity - heldQuantity];
        });
};
