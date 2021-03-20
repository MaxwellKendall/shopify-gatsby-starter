// https://iconmonstr.com/shopping-cart/ ICONS LOOK AMAZING

/* eslint-disable no-undef */
import React, { useContext, useEffect, useState } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCopyright,
    faShoppingCart,
    faSpinner,
    faMinusCircle,
    faPlusCircle,
    faTimes,
    faSearch,
    faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import {
    faFacebookSquare,
    faInstagramSquare,
    faLinkedinIn,
    faLinkedin,
    faPinterestP
} from '@fortawesome/free-brands-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import moment from 'moment';
import { delay } from 'lodash';

import CartContext from "../../globalState";
import { localStorageKey } from '../helpers';
import { fetchCart, subscribeToEmail, verifyCaptcha } from '../../client';
import { useAllProducts } from '../helpers/products';
import Nav from "./navigation/Nav";
import MobileNav from "./navigation/MobileNav";
import { totalItemsInCart } from '../helpers/cart';

library.add(
    faCopyright,
    faShoppingCart,
    faSpinner,
    faMinusCircle,
    faPlusCircle,
    faTimes,
    faSearch
);

require('../../styles/index.scss');

const defaultSubscribeStatus = {
    isLoading: false,
    subscribed: false,
    emailAddress: '',
    showConfirmation: false,
    showError: false,
    status: 'subscribed'
};

let confirmationToast;
// show toast for 2s
const toastDelay = 5000;

export const Layout = ({
    children,
    pageName = 'default',
    classNames = '',
    flexDirection = 'column',
    maxWidth = '100rem',
    location,
    isCheckoutLoading = false,
    styles = {}
}) => {
    const products = useAllProducts();
    const { site: { siteMetadata: { title: siteTitle } } } = useStaticQuery(
        graphql`
            query getSiteDetails {
                site {
                    siteMetadata {
                        title
                        description
                        author
                        keywords
                        siteUrl
                        tagLine
                        email
                    }
                }
            }
        `
    );
    const [userEmail, setUserEmail] = useState('');

    const [subscribeStatus, setSubscribeStatus] = useState(defaultSubscribeStatus);
    const { cart, dispatch } = useContext(CartContext);

    useEffect(() => {
        const cartFromStorage = JSON.parse(window.localStorage.getItem(localStorageKey));
        if (cartFromStorage && !cart.id) {
            // no local cart but we have a reference to the remote cart!
            const ageOfCart = moment.duration(moment().diff(moment(cartFromStorage.timeStamp))).asHours();
            const isCartExpired = ageOfCart > 23.9;
            if (isCartExpired) {
                window.localStorage.removeItem(localStorageKey);
                dispatch({ 'type': 'RESET_CART' });
            }
            else {
                // if the cart isn't expired, fetch it and populate the local state!
                fetchCart(cartFromStorage.id)
                    .then((payload) => {
                        dispatch({ type: 'INIT_REMOTE_CART', payload, products })
                    })
                    .catch((e) => {
                        console.error('Error Fetching Remote Cart: ', e)
                        dispatch({ type: 'ERROR_FROM_CART', error: e })
                    })
            }
        }
        else if (cart.id && !cartFromStorage) {
            // this is an error state, we probably should never get here!
            dispatch({ 'type': 'RESET_CART' });
        }
        else {
            // we already have everything the cart in local state!
            dispatch({ 'type': 'CLEAR_LOADING' });
        }

        return () => window.clearTimeout(confirmationToast)
    }, []);

    const updateUserEmail = (e) => {
        if (subscribeStatus.subscribed) {
            setSubscribeStatus({ ...subscribeStatus, subscribed: false });
        }
        setUserEmail(e.target.value);
    };

    const handleSubscribe = (status = 'subscribed') => {
        setSubscribeStatus({ isLoading: true, alreadyExists: false });
        return subscribeToEmail(userEmail, status)
            .then((data) => {
                if (data.title === 'Member Exists' || data.title === "Invalid Resource") {
                    throw({ email_address: userEmail, ...data });
                }
                setSubscribeStatus({
                    ...defaultSubscribeStatus,
                    showConfirmation: true,
                    subscribed: true,
                    emailAddress: data.email_address,
                    status
                })
                confirmationToast = delay(() => {
                    setSubscribeStatus({
                        ...subscribeStatus,
                        showConfirmation: false,
                        showError: false
                    })
                }, toastDelay);
            })
            .catch((e) => {
                console.error('Error Subscribing Member to List: ', e);
                setSubscribeStatus({
                    ...subscribeStatus,
                    subscribed: e.title === "Member Exists",
                    isLoading: false,
                    showError: e.title,
                    emailAddress: e.email_address
                });
                confirmationToast = delay(() => {
                    setSubscribeStatus({
                        ...subscribeStatus,
                        showConfirmation: false,
                        showError: false
                    });
                }, toastDelay);
            })
    };


    const handleSubmit = async (e) => {
        setSubscribeStatus({ ...subscribeStatus, isLoading: true });
        window.grecaptcha.ready(() => {
            window.grecaptcha.execute(GATSBY_RECAPTCHA_ID, { action: 'submit' })
                .then((token) => {
                    return verifyCaptcha(token)                    
                })
                .then((data) => {
                    if (data.success) {
                        handleSubscribe();
                    }
                    else if (!data.success) {
                        handleSubscribe('pending')
                    }
                })
                .catch((e) => {
                    console.error('Error in handle newsletter subscribe', e);
                    handleSubscribe();
                })
        })
    };

    return (
        <div className="global-container m-auto flex justify-center flex-col min-h-full">
            <MobileNav itemsInCart={totalItemsInCart(cart)} siteTitle={siteTitle} activePath={location.pathname} />
            <Nav itemsInCart={totalItemsInCart(cart)} siteTitle={siteTitle} activePath={location.pathname} maxWidth={maxWidth} />
            <main
                style={{ maxWidth, ...styles }}
                className={`default-page md:py-8 ${pageName} flex flex-wrap flex-${flexDirection} w-full h-full self-center justify-center flex-grow ${classNames}`}>
                    {isCheckoutLoading && <p>Loading...</p>}
                    {!isCheckoutLoading && children}
            </main>
            <footer className='flex-shrink-0 p-5 text-center'>
                {subscribeStatus.showError && subscribeStatus.showError === 'Member Exists' && (
                    <p>Hey, {subscribeStatus.emailAddress} is already subscribed! 🙌</p>
                )}
                {subscribeStatus.showError && subscribeStatus.showError === 'Invalid Resource' && (
                    <p>Uh oh... {subscribeStatus.emailAddress} doesn't appear to be a valid email! 😢</p>
                )}
                {subscribeStatus.showConfirmation && subscribeStatus.status === 'subscribed' && (
                    <p>Hey, {subscribeStatus.emailAddress} welcome to the family! 🙌</p>
                )}
                {subscribeStatus.showConfirmation && subscribeStatus.status === 'pending' && (
                    <>
                        <p>Hey, {subscribeStatus.emailAddress} welcome to the family! 🙌</p>
                        <strong>Please respond to our confirmation email and we'll keep you in the loop!</strong>
                    </>
                )}
                <>
                    <input type="hidden" name="u" value="ab3ec7367aea68f258236a7f3" />
                    <input type="hidden" name="id" value="2e064274d9" />
                    <div className="flex flex-col md:flex-row  items-center justify-center w-full">
                        <label className="pr-5 leading-7 tracking-wider">be the first to know</label>
                        <input className="leading-7 w-full md:w-auto border-solid border-black" type="email" name="MERGE0" value={userEmail} onChange={updateUserEmail} />
                        <button
                            disabled={(subscribeStatus.subscribed || !userEmail)}
                            type="submit"
                            className="leading-7 w-full px-10 md:px-5 md:w-auto md:ml-2"
                            onClick={handleSubmit}>
                            {subscribeStatus.isLoading && (
                                <FontAwesomeIcon className="ml-2" icon={['fas', 'spinner']} spin />
                            )}
                            {!subscribeStatus.isLoading && !subscribeStatus.subscribed && (
                                'SUBSCRIBE'
                            )}
                            {!subscribeStatus.isLoading && subscribeStatus.subscribed && (
                                'SUBSCRIBED' 
                            )}                        
                        </button>
                    </div>
                    <div className="flex w-full justify-center items-center mt-12">
                        <a href="https://www.facebook.com/ckendallart/" target="_blank">
                            <FontAwesomeIcon icon={faFacebookSquare} size="3x" className="mx-2" color="#dcd0d0" />
                        </a>
                        <a href="https://www.linkedin.com/in/claire-kendall-08049471/" target="_blank">
                            <FontAwesomeIcon icon={faLinkedin} size="3x" className="mx-2" color="#dcd0d0" />
                        </a>
                        <a href="https://www.instagram.com/ckendallart/" target="_blank">
                            <FontAwesomeIcon icon={faInstagramSquare} size="3x" className="mx-2" color="#dcd0d0" />
                        </a>
                        <a href="https://www.pinterest.com/CKendallart/_created/" target="_blank">
                            <FontAwesomeIcon icon={faPinterestP} size="3x" className="mx-2" color="#dcd0d0" />
                        </a>
                        <a href="mailto:info@ckendallart.com" target="_blank">
                            <FontAwesomeIcon icon={faEnvelope} size="3x" className="mx-2" color="#dcd0d0" />
                        </a>
                    </div>
                    <div className="text-xs mt-12 lg:mt-24">
                        <p>
                            {`Claire Kendall Art, ${new Date().getFullYear()}`}
                            <FontAwesomeIcon className="ml-2" icon={['fas', 'copyright']} />
                        </p>
                        <p>
                            This site is protected by reCAPTCHA and the Google
                            <a href="https://policies.google.com/privacy"> Privacy Policy </a>
                            and
                            <a href="https://policies.google.com/terms"> Terms of Service </a>
                            apply.
                        </p>
                    </div>
                </>
            </footer>
        </div>
    );
};

Layout.displayName = "Layout";

export default Layout;
