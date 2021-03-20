/* eslint-disable no-undef */
import React from 'react';
import CartContext, { useCart } from './globalState';

const Wrapper = ({ children }) => {
    const [cartState, dispatch] = useCart();
    return (
        <>
            <CartContext.Provider value={{cart: cartState, dispatch }}>
                {children}
            </CartContext.Provider>
        </>
    );
};

export const wrapRootElement = ({ element }) => {
    return <Wrapper children={element} />;
};
