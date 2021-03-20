import React from 'react';
import Img from "gatsby-image";

import { getServerSideMediaQueries } from '../helpers/img';

export default ({
    classNames = '',
    responsiveImgs,
    imgRef = null,
    imgName,
    imgType = "fixed"
}) => {
    return (
        <>
            <style>{getServerSideMediaQueries(responsiveImgs, `.${imgName}`)}</style>
            {imgType === "fixed" && (
                <Img
                    ref={imgRef}
                    className={`${classNames} ${imgName}`}
                    fixed={responsiveImgs} />
            )}
            {imgType === "fluid" && (
                <Img
                    ref={imgRef}
                    className={`${classNames} ${imgName}`}
                    fluid={responsiveImgs} />
            )}
        </>
    );
};
