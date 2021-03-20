import React, { useReducer } from 'react';
import { parseDataFromRemoteCart, parseLineItemsFromRemoteCart } from './src/helpers';

const initialState = {
    id: null,
    totalPrice: null,
    totalTax: null,
    webUrl: null,
    lineItems: [],
    imagesByVariantId: {},
    loading: 'cart',
    error: null
};


export const errorFetchingCart = {
    ...initialState,
    loading: ''
};

export const reducer = (state, action) => {
    switch (action.type) {
        case 'INIT_CART': {
            return {
                ...state,
                ...action.payload
            };
        };
        case 'INIT_REMOTE_CART': {
            return {
                ...parseDataFromRemoteCart(action.payload, action.products),
                loading: ''
            };
        };
        case 'ADD_TO_CART': {
            return {
                ...state,
                ...parseDataFromRemoteCart(action.payload, action.products)
            };
        };
        case 'UPDATE_CART': {
            return {
                ...state,
                ...parseDataFromRemoteCart(action.payload, action.products),
                imagesByVariantId: state.imagesByVariantId
            };
        };
        case 'REMOVE_FROM_CART': {
            const dataForNewLineItem = parseDataFromRemoteCart(action.payload, action.products);
            return {
                ...state,
                ...dataForNewLineItem
            };
        };
        case 'RESET_CART': {
            return {
                ...initialState,
                loading: ''
            };
        };
        case 'ERROR_FROM_CART': {
            return {
                ...state,
                loading: '',
                error: action.error
            };
        };
        case 'CLEAR_LOADING': {
            return {
                ...state,
                loading: '',
            };
        }
        default: {
            return state;
        }
    }
};

export const useCart = () => useReducer(reducer, initialState);

const CartContext = React.createContext({ cart: initialState, dispatch: () => {}});

export default CartContext;
