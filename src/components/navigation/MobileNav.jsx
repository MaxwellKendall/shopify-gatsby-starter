import React, { useState, useEffect } from 'react';
import { Link } from 'gatsby';
import Img from "gatsby-image";

import { CartIcon, ExpandableMenuIcon } from './Nav';

import { usePages } from "../../helpers/navigation";

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fillRule="evenodd" clipRule="evenodd">
        <path d="M24 18v1h-24v-1h24zm0-6v1h-24v-1h24zm0-6v1h-24v-1h24z" fill="#1040e2"/>
        <path d="M24 19h-24v-1h24v1zm0-6h-24v-1h24v1zm0-6h-24v-1h24v1z"/>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fillRule="evenodd" clipRule="evenodd">
        <path d="M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z"/>
    </svg>
)

const NavIcon = ({ classNames = '', isNotClosed, onClick }) => (
    <button
        onClick={onClick}
        className={`${classNames}`} >
        {isNotClosed && <CloseIcon />}
        {!isNotClosed && <MenuIcon />}
    </button>
);

const expandedClassByToggleState = {
    closing: 'mobile-nav-closing',
    open: 'mobile-nav-opened'
};

const newStatusByCurrentStatus = {
    open: 'closing',
    closed: 'open',
    closing: 'closed'
};

let timeout = null;

export default ({
    itemsInCart,
    activePath,
    siteTitle
}) => {
    const { pages, logo } = usePages();
    const [menuExpandedStatus, setMenuExpandedStatus] = useState('closed');
    const toggleMenuWithDelayedClose = (e, newStatus = newStatusByCurrentStatus[menuExpandedStatus]) => {
        e.preventDefault();
        if (newStatus === 'closing') {
            setMenuExpandedStatus(newStatus);
            timeout = window.setTimeout(() => {
                setMenuExpandedStatus('closed');
            }, 225);
        }
        else {
            setMenuExpandedStatus(newStatus)
        }
    };

    useEffect(() => {
        if (timeout) {
            return () => window.clearTimeout(timeout);
        }
    }, []);

    const isNotClosed = (menuExpandedStatus === 'closing' || menuExpandedStatus === 'open');

    return (
        <header className="flex py-5 items-center md:hidden">
            <NavIcon isNotClosed={isNotClosed} onClick={toggleMenuWithDelayedClose} classNames={`pl-5`} />      
            <Link to='/' className={`mx-auto`}>
                <h1 className="text-2xl font-light">{siteTitle.toUpperCase()}</h1>
            </Link>
            <Link to='/cart/' className={`self-center ${itemsInCart === 0 ? 'pr-5' : ''}`}>
                <CartIcon numberOfItemsInCart={itemsInCart} />
            </Link>
            {isNotClosed && (
                <div className={`${expandedClassByToggleState[menuExpandedStatus]} w-full bg-white p-5 fixed z-10`}>
                    <div className="flex">
                        <Link activeClassName="mobile-sqrl-active-link" to={"/"}>
                            <Img fluid={logo} className="w-20 h-8 mr-auto self-start" />
                        </Link>
                        <NavIcon isNotClosed={isNotClosed} onClick={toggleMenuWithDelayedClose} classNames="ml-auto" />
                    </div>
                    <ul className={`w-full flex-col items-center text-center justify-center`}>
                        {pages.map((page) => {
                            if (page.isExpandable) {
                                return <ExpandableMenuIcon {...page} activePath={activePath} />
                            } 
                            return (
                                <li className="p-2 mt-10 text-xl md:text-lg">
                                    <Link activeClassName="mobile-sqrl-active-link" to={page.link}>
                                        {page.name.toUpperCase()}
                                    </Link>
                                </li>
                            );
                        }
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
}