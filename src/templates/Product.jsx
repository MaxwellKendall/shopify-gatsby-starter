import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { graphql, Link } from 'gatsby';
import Img from "gatsby-image";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import { uniqueId, kebabCase, debounce } from 'lodash';
import Modal from 'react-modal';

import { logEvent } from "../helpers/analytics";
import CartContext from "../../globalState";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import {
    getParsedVariants,
    localStorageKey,
    getLineItemForAddToCart,
    isVariantInCart,
    getLineItemForUpdateToCart,
    getInventoryDetails
} from '../helpers';
import { initCheckout, addLineItemsToCart, updateLineItemsInCart } from '../../client';
import { getAfterPaySingleInstallment, getDefaultProductImage, getPrettyPrice, useAllProducts } from '../helpers/products';
import { getResponsiveImages, getServerSideMediaQueries } from '../helpers/img';
import AfterPay from '../components/AfterPay';

const isSSR = (typeof window === 'undefined');
const hoverPositionOffset = 0.25;

const getLowestPrice = (otherProducts) => {
    return otherProducts
        .reduce((lowestPrice, { priceRange: { low: currentPrice }}) => {
            if (lowestPrice === null) return Number(currentPrice).toFixed(2);
            if (parseInt(currentPrice, 10) > parseInt(lowestPrice, 10)) return Number(lowestPrice).toFixed(2);
            return currentPrice;
        }, null);
}

const modalStyles = {
    content: {
        display: 'flex',
        'justifyContent': 'center',
        'alignItems': 'center',
        background: 'rgba(0,0,0, 0.05)',
        height: '100%',
        width: '100%',
        border: 'none',
        top: '0',
        bottom: '0',
        right: '0',
        left: '0',
    }
};

Modal.setAppElement('#___gatsby');

const initialDimensionsState = {
    top: 0,
    left: 0,
    width: 0,
    height: 0
};

const getDetails = (desc) => {
    const details = desc.split('Details: ')[1];
    if (details) {
        return (
            <ul className="w-full pl-10 text-lg list-disc">
                {details
                    .split(';')
                    .filter((chars) => chars.length > 0)
                    .map((detail) => {
                        return (
                            <li className="text-left">{detail}</li>
                        )
                    })
                }

            </ul>
        );
    }
    return <p className="w-full text-log">No Details for this item.</p>;
};

const DetailsToggle = ({
    header = "Details",
    children,
    classNames
}) => {
    const [showDetails, setShowDetails] = useState(false);
    return (
        <button className={`${classNames} active:outline-none focus:outline-none w-full flex flex-wrap px-5 lg:px-0`} onClick={() => setShowDetails(!showDetails)}>
            <p className="text-lg mr-auto">{header}</p>
            <button className="active:outline-none focus:outline-none text-xl font-semibold" onClick={() => setShowDetails(!showDetails)}>{showDetails && `-`}{!showDetails && `+`}</button>
            {showDetails && children}
        </button>
    )
}

export default ({
    id,
    pathContext: {
        title,
        description,
        priceRange: { high, low },
    },
    data: { 
        shopifyProduct: product,
        productImages,
        otherImagesInCollection,
        afterPayPopup: { img: afterPayPopup }
    },
    location
}) => {
    const { cart, dispatch } = useContext(CartContext);
    const products = useAllProducts();
    const { variants, productType, handle, collection } = product;
    const parsedVariants = getParsedVariants(variants, title);
    const [selectedVariant, setSelectedVariant] = useState(parsedVariants[0]);
    const [selectedImg, setSelectedImg] = useState(getResponsiveImages(parsedVariants[0]));
    const [remoteInventory, setRemoteInventory] = useState(1);
    const [remainingInventory, setRemainingInventory] = useState(0);
    const [modalImg, showModalImg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hoverImageDimensions, setHoverImageDimensions] = useState(initialDimensionsState);
    const [magnifyDimensions, setMagnifyDimensions] = useState(initialDimensionsState);
    const imgRef = useRef(null);
    const magnifyImg = useRef(null);

    const handleResize = debounce(() => {
        // resize window, changing images, whateva
        if (imgRef.current && imgRef.current.imageRef.current) {
            const { top, left, width, height } = imgRef.current.imageRef.current.getBoundingClientRect();
            setHoverImageDimensions({
                top: top + window?.pageYOffset,
                left: left + window?.pageXOffset,
                width,
                height
            });
        }
    }, 10)

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        handleResize();
    }, [imgRef.current])

    const checkInventory = useCallback(async () => {
        setIsLoading(true);
        const [
            remoteQuantity,
            remainingQuantity
        ] = await getInventoryDetails(selectedVariant.id, cart);
        setRemoteInventory(remoteQuantity);
        setRemainingInventory(remainingQuantity);
        setIsLoading(false);
    }, [selectedVariant, setRemainingInventory, setRemoteInventory, setIsLoading, cart.lineItems]);

    useEffect(() => {
        console.info('checking the inventory.... 👍👍👍👍');
        checkInventory();
    }, [checkInventory]);

    const handleSelectVariant = (e) => {
        const selectedVariant = parsedVariants.find((node) => node.title === e.target.value);
        setSelectedVariant(selectedVariant);
        setSelectedImg(getResponsiveImages(selectedVariant));
    }

    const modifyCart = (cartId) => {
        const isExistingLineItem = isVariantInCart(cart, selectedVariant.id);
        if (isExistingLineItem) {
            const lineItemToUpdate = getLineItemForUpdateToCart(cart.lineItems, selectedVariant.id);
            return updateLineItemsInCart(cartId, [{ ...lineItemToUpdate, quantity: lineItemToUpdate.quantity + 1 }])
                .then((payload) => {
                    dispatch({ type: 'UPDATE_CART', payload: { ...payload, variantId: selectedVariant.id }, products });
                })
                .then(() => {
                    setIsLoading(false);
                })
                .catch((e) => {
                    console.error('error updating existing line item in cart', e);
                });
        }
        return addLineItemsToCart(cartId, getLineItemForAddToCart({ ...product, selectedVariant }, 1))
            .then((payload) => {
                dispatch({
                    type: 'ADD_TO_CART',
                    payload,
                    products: products,
                    collection: kebabCase(productType)
                });
            })
            .then(() => {
                setIsLoading(false);
            });
    }

    const handleAddToCart = (e) => {
        e.preventDefault();
        logEvent({
            // string - required - The object that was interacted with (e.g.video)
            category: "Cart",
            // string - required - Type of interaction (e.g. 'play')
            action: "Add to Cart",
            // string - optional - Useful for categorizing events (e.g. 'Spring Campaign')
            // number - optional - Numeric value associated with the event. (e.g. A product ID)
            label: `${title} : ${selectedVariant.title}`
        });
        setIsLoading(true);
        if (product.tags.some((tag) => tag.includes('link'))) {
            setIsLoading(false);
            return window.open(product.tags.reduce((acc, str) => {
                if (str.includes('link')) {
                    return `https://${str.split(':https://')[1]}`;
                }
                return acc;
            }, ''));
        }
        if (cart.id) {
            return modifyCart(cart.id);
        }
        return initCheckout()
            .then((resp) => {
                const timeStamp = moment.now('DD MM YYYY hh:mm:ss');
                window.localStorage.setItem(localStorageKey, JSON.stringify({'id': resp.id, timeStamp }))
                dispatch({ type: 'INIT_CART', payload: resp });
                return resp
            })
            .then((newCart) => {
                modifyCart(newCart.id)
            })
            .catch((e) => {
                console.error('error initCheckout', e);
                logEvent({
                    // string - required - The object that was interacted with (e.g.video)
                    category: "Cart",
                    // string - required - Type of interaction (e.g. 'play')
                    action: "Error adding to Cart",
                    // string - optional - Useful for categorizing events (e.g. 'Spring Campaign')
                    label: e
                    // number - optional - Numeric value associated with the event. (e.g. A product ID)
                });
                throw(e);
            })
    };

    const isSoldOut = (
        remoteInventory <= 0 ||
        remainingInventory <= 0
    );

    const setImgZoom = (bool) => {
        if (window?.innerWidth < 760) {
            if (isZoomed) setIsZoomed(false);
            return;
        }
        if (isZoomed === bool) return
        setIsZoomed(bool);
        setMagnifyDimensions({ left: 0, top: 0 });
    }
    
    const debouncedMouseHandler = debounce(({ clientY, clientX, pageY }) => {
        const {
            height: magnifyImgHeight,
            width: magnifyImgWidth
        } = magnifyImg.current.imageRef.current.getBoundingClientRect();
        const {
            top: hoverImgTop,
            width: hoverImgWidth,
            height: hoverImgHeight,
            left: hoverImgLeft
        } = hoverImageDimensions;
        const scrolledY = pageY - clientY;
        const horizontalDiff = magnifyImgWidth - hoverImgWidth;
        const verticalDiff = magnifyImgHeight - hoverImgHeight;
        const horizontalMax = (horizontalDiff / magnifyImgWidth) * 100;
        const verticalMax = (verticalDiff / magnifyImgHeight) * 100;
        const horizontalPosition = ((clientX - hoverImgLeft) / hoverImgWidth);
        const verticalPosition = ((clientY + scrolledY) - hoverImgTop) / hoverImgHeight;
        const horizontalPositionAsPercentage = (horizontalPosition - hoverPositionOffset) * 100;
        const verticalPositionAsPercentage = (verticalPosition - hoverPositionOffset) * 100;
        setMagnifyDimensions({
            left: horizontalPositionAsPercentage > horizontalMax ? horizontalMax : horizontalPositionAsPercentage,
            top: verticalPositionAsPercentage > verticalMax ? verticalMax : verticalPositionAsPercentage
        });
    }, 5)

    const handleHoverZoom = (event) => {
        event.persist();
        debouncedMouseHandler(event);
    }

    const handleProductImgClick = (e, i) => {
        e.preventDefault();
        logEvent({
            // string - required - The object that was interacted with (e.g.video)
            category: "Product",
            // string - required - Type of interaction (e.g. 'play')
            action: "Show Details",
            // string - optional - Useful for categorizing events (e.g. 'Spring Campaign')
            label: "Show Details",
            // number - optional - Numeric value associated with the event. (e.g. A product ID)
            value: `${title} : ${selectedVariant.title}`
        })
        setSelectedImg(getResponsiveImages({ img: productImages.nodes[i] }));
        handleResize();
        
    }

    const showAfterPayImg = () => {
        showModalImg('afterpay');
        setIsModalOpen(true);
        logEvent({
            // string - required - The object that was interacted with (e.g.video)
            category: "AfterPay",
            // string - required - Type of interaction (e.g. 'play')
            action: "Show Details",
            // string - optional - Useful for categorizing events (e.g. 'Spring Campaign')
            label: "Show Details",
            // number - optional - Numeric value associated with the event. (e.g. A product ID)
            value: `${title} : ${selectedVariant.title}`
        })
    }

    const showProductOverlay = () => {
        showModalImg('product');
        setIsModalOpen(true);
    }

    const getTruncatedDescription = (desc) => {
        return desc.split('Details: ')[0];
    }

    const otherProducts = otherImagesInCollection
        .nodes
        .filter((product) => {
            return (
                product.variants.some((variant) => variant.localFile && variant.availableForSale) &&
                product.handle !== handle
            );
        })
        .map((node) => {
            return {
                ...node,
                img: node.variants.find(({ localFile }) => localFile).localFile
            }
        })
        .slice(0, 3)

    return (
        <SEO
            title={title}
            pathname={location.pathname}
            image={selectedImg?.responsiveImgs[0]}
            description={description}>
            <Layout pageName="product-page" flexDirection="row" classNames="flex-wrap sqrl-grey" maxWidth="100rem" location={location}>
                {/* MOBILE TITLE ONLY */}
                <h2 className="text-xl tracking-widest text-center w-full my-4 md:text-2xl lg:text-4xl lg:hidden">{title.toUpperCase()}</h2>
                {/* MAIN PRODUCT IMG */}
                {selectedVariant.img && (
                    <div className="md:mx-5 lg:w-1/2 xl:w-3/5">
                        <div className="flex justify-center mb-4">
                            <style>{getServerSideMediaQueries(selectedImg.responsiveImgs, ".product-img, .product-img img")}</style>
                            <Img
                                ref={imgRef}
                                className="product-img w-full"
                                fixed={selectedImg.responsiveImgs} />
                        </div>
                        {/* ZOOM IMG */}
                        <div
                            className={`${isZoomed ? 'opacity-100' : ' opacity-0'} hidden md:block absolute overflow-hidden`}
                            onMouseEnter={() => setImgZoom(true)}
                            onMouseLeave={() => setImgZoom(false)}
                            onClick={showProductOverlay}
                            onMouseMove={handleHoverZoom}
                            onTouchMove={handleHoverZoom}
                            style={{
                                width: `${hoverImageDimensions.width}px`,
                                top: `${hoverImageDimensions.top}px`,
                                height: `${hoverImageDimensions.height}px`,
                                left: `${hoverImageDimensions.left}px`,
                                transition: 'opacity .25s ease-in .05s'
                            }}>
                            <style>{getServerSideMediaQueries(selectedImg.responsiveHoverImgs, ".hover-img img, .hover-img")}</style>
                            <Img
                                ref={magnifyImg}
                                className="w-full hover-img"
                                onClick={showProductOverlay}
                                fixed={selectedImg.responsiveHoverImgs}
                                imgStyle={{
                                    top: `${magnifyDimensions.top > 0 ? -magnifyDimensions.top : 0}%`,
                                    left: `${magnifyDimensions.left > 0 ? -magnifyDimensions.left : 0}%`,
                                }}
                                style={{
                                    transform: 'transition all ease-in'
                                }} />
                        </div>
                        {/* OTHER AVAILABLE PRODUCT IMAGES */}
                        <ul className="flex justify-center flex-wrap w-full xl:px-10">
                            {productImages.nodes.map(({ thumbnail }, i) => (
                                <li className="mr-2" onClick={(e) => handleProductImgClick(e, i)}>
                                    <Img fixed={thumbnail.fixed} />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {/* PRODUCT DESCRIPTION */}
                <div className="product-desc flex flex-col items-center self-center w-full mt-5 lg:w-2/5 xl:w-1/3 lg:mr-5 lg:my-0">
                    {/* DESKTOP TITLE */}
                    <h2 className="hidden lg:inline text-4xl tracking-widest text-left w-full">{title.toUpperCase()}</h2>
                    {/* PRODUCT PRICE */}
                    {!isSoldOut && (
                        <p className="lg:inline w-full text-2xl py-4 tracking-widest text-center lg:my-5 lg:text-left">{getPrettyPrice(selectedVariant.price)}</p>
                    )}
                    {/* PRODUCT VARIANTS PRICE RANGE */}
                    {high !== low && !isSoldOut && (
                        <p className="lg:flex text-sm italic w-full text-center mb-5 lg:text-left">{`from ${getPrettyPrice(low)} to ${getPrettyPrice(high)}`}</p>
                    )}
                    {/* AFTER PAY DISCLOSURE WHEN INSTALLMENTS ARE KNOWN (Product price is under $1K) */}
                    {!isSoldOut && selectedVariant.price >= 35 && selectedVariant.price < 1000 && (
                        <p className="w-full flex text-center lg:text-left justify-center items-center lg:justify-start flex-wrap uppercase tracking-wide">
                            or 4 interest-free installments of <strong className="mx-1">{` ${getAfterPaySingleInstallment(selectedVariant.price)} `}</strong> by 
                            <button className="m-1 flex-col-center" onClick={showAfterPayImg}>
                                <AfterPay />
                            </button>
                        </p>
                    )}
                    {/* AFTER PAY DISCLOSURE WHEN INSTALLMENTS ARE UNKNOWN (Product price is over $1K) */}
                    {!isSoldOut && (selectedVariant.price < 35 || selectedVariant.price >= 1000) && (
                        <p className="w-full flex text-center lg:text-left justify-center items-center lg:justify-start flex-wrap uppercase tracking-wide px-5 lg:px-0">
                            Interest free installments by 
                            <button className="m-1 flex items-center" onClick={showAfterPayImg}>
                                <AfterPay />
                            </button>
                            available between <strong className="mx-1">{getPrettyPrice(35)}</strong> and <strong className="mx-1">{getPrettyPrice(1000)}</strong>.
                        </p>
                    )}
                    {/* ADD TO CART BUTTON */}
                    <div className="actions w-full flex flex-col my-5 justify-start items-center">
                        <button
                            className="border text-white border-black w-64 py-5 px-2 text-xl uppercase mb-2 self-center lg:self-start sqrl-purple"
                            disabled={(isSoldOut || isLoading)}
                            onClick={handleAddToCart}>
                            {isLoading && <FontAwesomeIcon icon="spinner" spin />}
                            {!isLoading && !isSoldOut && 'Add to Cart'}
                            {isSoldOut && !isLoading && 'SOLD OUT'}
                        </button>
                        {/* VARIANT DROPDOWN SELECTOR */}
                        {parsedVariants.length > 1 && (
                            <select
                                className="border border-black w-1/2 lg:self-start lg:mt-5"
                                name="variants"
                                onChange={handleSelectVariant}
                                value={selectedVariant.title}>
                                {parsedVariants.map((variant) => (
                                    <option key={uniqueId('')} value={variant.title}>{variant.title}</option>
                                ))}
                            </select>
                        )}
                        {/* PRODUCT DESCRIPTION AND DETAILS */}
                        <p className="text-lg py-10 tracking-wide px-5 lg:px-0">{getTruncatedDescription(description)}</p>
                        <DetailsToggle>
                            {getDetails(description)}
                        </DetailsToggle>
                        {productType.toLowerCase() !== 'commission' && (
                            <DetailsToggle header="Shipping &amp; Returns" classNames="pt-2">
                                <ul className="w-full pl-10 text-lg list-disc">
                                    {productType.toLowerCase().includes('print') && (
                                        <>
                                            <li className="text-left"><strong>Free shipping</strong> </li>
                                            <li className="text-left">Please allow 2-7 days for printing and an additional 3-7 days for shipping</li>
                                            <li className="text-left">All original paintings, prints and commissions are final sale and cannot be returned or exchanged</li>
                                            <li className="text-left">Please refer to <Link className="underline" to="/shipping-and-returns">our shipping and return policy</Link> for refund exceptions</li>
                                            <li className="text-left">Print products ship to most international locations </li>
                                        </>
                                    )}
                                    {!productType.toLowerCase().includes('print') && (
                                        <>
                                            <li className="text-left"><strong>Free shipping</strong> to all locations within the continental U.S.</li>
                                            <li className="text-left">Package insurance <strong>up to the full price of the painting</strong> included with every shipment.</li>
                                            <li className="text-left">All original paintings, prints and commissions are final sale and cannot be returned or exchanged.</li>
                                            <li className="text-left">Please refer to <Link className="underline" to="/shipping-and-returns">our shipping and return policy</Link> for refund exceptions and more details on how we ensure a safe and effective delivery.</li>
                                        </>
                                    )}
                                </ul>
                            </DetailsToggle>

                        )}
                    </div>
                </div>
                {/* OTHER PRODUCTS IN COLLECTION */}
                <h3 className="pt-10 pb-5 pl-5 w-full text-xl tracking-wide md:tracking-wider lg:tracking-widest">MORE FROM {getPrettyPrice(getLowestPrice(otherProducts))}</h3>
                <ul className="px-1 lg:pl-5 flex flex-wrap justify-center items-start w-full">
                    {otherProducts
                        .map((product, i) => {
                            const responsiveImgs = getDefaultProductImage(product, 'fluid');
                            return (
                                <li className={i === 1 ? 'px-1 md:px-2 lg:px-5 w-1/3' : 'w-1/3'}>
                                    <Link className="w-full" to={`${product.slug}/`}>
                                        <Img className="w-full" fluid={responsiveImgs} />
                                    </Link>
                                </li>
                            );
                        })
                    }
                </ul>
                {/* BIG IMG OVERLAY ON PRODUCT IMG CLICK */}
                <Modal
                    onRequestClose={() => {
                        setIsModalOpen(false);
                        showModalImg('');
                    }}
                    isOpen={isModalOpen}
                    style={modalStyles}>
                    <div className={`w-full flex-col-center h-full relative overflow-auto`} onClick={() => setIsModalOpen(false)}>
                        {modalImg === 'afterpay' && <Img className="w-5/6 md:w-1/2" style={{ maxWidth: '500px' }} fluid={afterPayPopup.fluid} />}
                        {modalImg === 'product' && (
                            <div className="h-auto" style={{ marginTop: '50%' }}>
                                <Img fixed={selectedImg.responsiveHoverImgs} className="overlay-product-img" />
                            </div>
                        )}                    
                    </div>
                </Modal>
            </Layout>
        </SEO>
    );
};

export const query = graphql`
    query GetProduct($id: String, $collection: String ) {
        shopifyProduct(id: {eq: $id}) {
            id
            handle
            productId
            productType
            collection
            title
            tags
            variants {
                price
                title
                id
                sku
                img: localFile {
                    small: childImageSharp {
                        fixed(width:300) {
                            ...GatsbyImageSharpFixed
                          }
                    }
                    medium: childImageSharp {
                        fixed(width:500) {
                            ...GatsbyImageSharpFixed
                          }
                    }
                    large: childImageSharp {
                        fixed(width:700) {
                            ...GatsbyImageSharpFixed
                          }
                    }
                    hoverImgs: childImageSharp {
                        small: fixed(width:500) {
                            ...GatsbyImageSharpFixed
                        }
                        medium: fixed(width:1000) {
                            ...GatsbyImageSharpFixed
                        }
                    }
                }
                weight
                weightUnit
            }
        }
        productImages: allFile(filter: {parent: {id: {eq: $id}}}) {
            nodes {
              thumbnail: childImageSharp {
                    fixed(width:150) {
                        ...GatsbyImageSharpFixed
                    }
               }
                small: childImageSharp {
                    fixed(width:300) {
                        ...GatsbyImageSharpFixed
                    }
                }
                medium: childImageSharp {
                    fixed(width:500) {
                        ...GatsbyImageSharpFixed
                    }
                }
                large: childImageSharp {
                    fixed(width:700) {
                        ...GatsbyImageSharpFixed
                    }
                }
                hoverImgs: childImageSharp {
                    small: fixed(width:500) {
                        ...GatsbyImageSharpFixed
                    }
                    medium: fixed(width:1000) {
                        ...GatsbyImageSharpFixed
                    }
                }
            }
        }
        otherImagesInCollection: allShopifyProduct(filter: {collection: {eq: $collection }}) {
            nodes {
                id
                title
                handle
                slug
                priceRange {
                    low
                }
                localFile {
                    small: childImageSharp {
                        fluid(maxWidth:150) {
                            ...GatsbyImageSharpFluid
                        }
                    }
                    medium: childImageSharp {
                        fluid(maxWidth:300) {
                            ...GatsbyImageSharpFluid
                        }
                    }
                    large: childImageSharp {
                        fluid(maxWidth:425) {
                            ...GatsbyImageSharpFluid
                        }
                    }
                }
                variants {
                    availableForSale 
                    localFile {
                        small: childImageSharp {
                            fluid(maxWidth:150) {
                                ...GatsbyImageSharpFluid
                            }
                        }
                        medium: childImageSharp {
                            fluid(maxWidth:300) {
                                ...GatsbyImageSharpFluid
                            }
                        }
                        large: childImageSharp {
                            fluid(maxWidth:425) {
                                ...GatsbyImageSharpFluid
                            }
                        }
                    }
                }
            }
        }
        afterPayPopup: file(name: {eq: "afterpay-popup"}) {
            img: childImageSharp {
                fluid(maxWidth:500) {
                    ...GatsbyImageSharpFluid
                }
            }
        }
    }
`;
