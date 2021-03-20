import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'gatsby';
import { kebabCase } from 'lodash';

import { getDefaultProductImage, getPrettyPrice } from "../helpers/products"
import Img from './Img';

const defaultSort = ({ variants: variantsA, priceRange: { low: lowestPriceA } }, { variants: variantsB, priceRange: { low: lowestPriceB } }) => {
    const a = variantsA.some((({ availableForSale }) => availableForSale));
    const b = variantsB.some((({ availableForSale }) => availableForSale));
    if (a && !b) return -1;
    if (!a && b) return 1;
    if (parseInt(lowestPriceB, 10) > parseInt(lowestPriceA, 10)) return -1;
    if (parseInt(lowestPriceA, 10) > parseInt(lowestPriceB, 10)) return 1;
    return 0;
};

export default ({
    products,
    sortFn = defaultSort,
    ctx = "forSale",
    path
}) => {
    const sortedProducts = products
        .sort(sortFn);
    
    return (
        <>
            <ul className="flex flex-col w-full lg:w-1/2">
                {sortedProducts
                    .map((product, i) => {
                        const className = i % 2 === 0
                            ? 'flex'
                            // show the odd ones in  the first column until desktop
                            : 'flex lg:hidden'
                        return ({ ...product, className, img: getDefaultProductImage(product) })
                    })
                    .filter(({ img }) => img)
                    .map(({ slug, img, title, variants, priceRange: { low: lowestPrice }, className }, i) => {
                        const hasVariantForSale = variants.some((({ availableForSale }) => availableForSale));
                        return (
                            <li className={`my-2 lg:mr-2 ${className}`}>
                                <Link to={`${slug}/`} className="grid-product-img flex flex-col items-center lg:items-end w-full">
                                    <div className="relative">
                                        <Img responsiveImgs={img} imgName={kebabCase(title)} />
                                        {!hasVariantForSale && ctx === "forSale" && (
                                            <span
                                                className="absolute top-0 mt-4 md:mt-12 text-white font-semibold text-center w-24 md:w-40 text-2xl md:text-3xl py-2 left-0 tracking-widest"
                                                style={{ backgroundColor: "#C097D0", border: "3px solid #8D647A", left: '-.5rem' }}>
                                                SOLD
                                            </span>
                                        )}
                                        <span
                                            className="hidden md:flex opacity-0 product-info font-semibold text-base md:text-xl py-5 mb-5 px-5 bottom-0 absolute flex-wrap items-center justify-center bg-gray-300 tracking-widest text-center w-full"
                                            style={{ width: '100%', marginBottom: '7px' }}>
                                                {title.toUpperCase()}
                                                {hasVariantForSale && variants.length > 1 && <span className="w-full text-center">from {getPrettyPrice(lowestPrice)}</span>}
                                                {hasVariantForSale && variants.length === 1 && <span className="w-full text-center">{getPrettyPrice(lowestPrice)}</span>}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
            </ul>
            <ul className="hidden lg:flex flex-col w-full lg:w-1/2">
                {sortedProducts
                    .map((product, i) => {
                        const className = i % 2 !== 0
                            ? 'hidden lg:flex'
                            // always hide the even ones
                            : 'hidden'
                        return ({ ...product, className, img: getDefaultProductImage(product) })
                    })
                    .filter(({ img }) => img)
                    .map(({ slug, img, title, variants, priceRange: { low: lowestPrice }, className }) => {
                        const hasVariantForSale = variants.some((({ availableForSale }) => availableForSale));
                        return (
                            <li className={`my-2 ml-2 ${className}`}>
                                <Link to={`${slug}/`} className="grid-product-img flex flex-col items-start w-full">
                                    <div className="relative">
                                        <Img responsiveImgs={img} imgName={kebabCase(title)} />
                                        {!hasVariantForSale && ctx === "forSale" && (
                                            <span
                                                className="absolute top-0 mt-4 md:mt-12 text-white font-semibold text-center w-24 md:w-40 text-2xl md:text-3xl py-2 left-0 tracking-widest"
                                                style={{ backgroundColor: "#C097D0", border: "3px solid #8D647A", left: '-.5rem' }}>
                                                SOLD
                                            </span>
                                        )}
                                        <span
                                            className="hidden md:flex opacity-0 product-info font-semibold text-base md:text-xl py-5 mb-5 px-5 bottom-0 absolute flex-wrap items-center justify-center bg-gray-300 tracking-widest text-center w-full"
                                            style={{ width: '100%', marginBottom: '7px' }}>
                                                {title.toUpperCase()}
                                                {hasVariantForSale && variants.length > 1 && <span className="w-full text-center">from {getPrettyPrice(lowestPrice)}</span>}
                                                {hasVariantForSale && variants.length === 1 && <span className="w-full text-center">{getPrettyPrice(lowestPrice)}</span>}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
            </ul>
        </>
    );
}