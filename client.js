/* eslint-disable no-undef */
import Client from 'shopify-buy';
import fetch from 'isomorphic-fetch';

const customMiddleWareUrl = `https://emrik8wwe3.execute-api.us-east-1.amazonaws.com/Prod`;

const client = Client.buildClient({
  domain: `${GATSBY_SHOP_NAME}.myshopify.com`,
  storefrontAccessToken: GATSBY_ACCESS_TOKEN
});

const adminAPIBaseUrl = `${customMiddleWareUrl}/inventory`;

export const fetchProductInventory = (variantId) => {
  const parsedVariantId = window.atob(variantId).split('/').pop();
  // remove hard code later.
  return fetch(`${adminAPIBaseUrl}?variantId=${parsedVariantId}`, {
    method: 'get',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(async (data) => {
    const { body: { variant: { inventory_quantity: remainingInventory, fulfillment_service }} } = await data.json();
    console.info('number of variants remaining', remainingInventory);
    if (fulfillment_service === 'printful') return 999;
    return remainingInventory;
  })
  .catch((e) => {
    console.error('Error fetching inventory', e);
  });
}

export const subscribeToEmail = (email, status = 'subscribed') => {
  return fetch(`${customMiddleWareUrl}/email-subscribe`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email_address: email,
      status,
      merge_fields: {
        MERGE0: email
      }
    })
  })
  .then(async (resp) => {
    const data = await resp.json();
    return data;
  })
  .catch((e) => {
    const error = e.json();
    return error;
  })
}

export const verifyCaptcha = (token) => {
  return fetch(`${customMiddleWareUrl}/recaptcha`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: token })
  })
  .then(async (data) => {
    const resp = await data.json();
    return resp;
  })
  .catch((e) => {
    return e;
  })
}

export const initCheckout = () => {
  // eslint-disable
  return client.checkout.create().then((checkout) => {
    // Do something with the checkout
    return checkout;
  });
};

export const fetchCart = (checkoutId) => {
  return client.checkout.fetch(checkoutId).then((checkout) => {
    // Do something with the checkout
    return checkout;
  });
};

export const addLineItemsToCart = (checkoutId, lineItemsToAdd) => {
  // Add an item to the checkout
  return client.checkout.addLineItems(checkoutId, lineItemsToAdd).then((checkout) => {
    // Returns only updated line items
    return checkout;
  });
};

export const removeLineItemsFromCart = (checkoutId, lineItemIdsToRemove) => {
  return client.checkout.removeLineItems(checkoutId, lineItemIdsToRemove).then((checkout) => {
    // Do something with the updated checkout
    return checkout; // Checkout with line item 'xyz' removed
  });
};

export const updateLineItemsInCart = (checkoutId, updatedLineItems) => {
  // Update the line item on the checkout (change the quantity or variant)
  return client.checkout.updateLineItems(checkoutId, updatedLineItems).then((checkout) => {
   return checkout;
  });
};

export const requestCommission = (data) => {
  return fetch(`${customMiddleWareUrl}/send-email`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then((res) => {
    return res;
  })
  .catch((e) => {
    return e;
  })
};
