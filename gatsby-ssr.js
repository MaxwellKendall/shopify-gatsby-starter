import React from 'react';
// import { Helmet } from 'react-helmet';

const LoadScripts = () => {
    return (
        <>
            <script src={`https://www.google.com/recaptcha/api.js?render=${GATSBY_RECAPTCHA_ID}`}></script>
            <script dangerouslySetInnerHTML={{
                __html: `(function(w, d, s, l, i) {
                    w[l] = w[l] || [];
                    w[l].push({
                        'gtm.start':
                            new Date().getTime(), event: 'gtm.js'
                    }); var f = d.getElementsByTagName(s)[0],
                        j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
                            'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
                })(window, document, 'script', 'dataLayer', '${GATSBY_GTM_ID}')`
            }} />
            <script dangerouslySetInnerHTML={{
                __html: `((c, l, a, r, i, t, y) => {
                    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
                    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
                    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
                })(window, document, 'clarity', 'script', '${GATSBY_CLARITY_ID}')`
            }} />
        </>
    );
}

const GtmNoScript = () => (
    <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${GATSBY_GTM_ID}`} style={{ height: 0, width: 0, display: 'none', visibility: 'hidden' }}></iframe></noscript>
);

export { wrapRootElement } from "./wrap-root-element";

// using react helmet for SSR? Not sure if this is necessary
// export const onRenderBody = ({
//     setHeadComponents,
//     setHtmlAttributes,
//     setBodyAttributes,
// }) => {
//     const helmet = Helmet.renderStatic()
//     setHtmlAttributes(helmet.htmlAttributes.toComponent())
//     setBodyAttributes(helmet.bodyAttributes.toComponent())
//     setHeadComponents([
//         helmet.title.toComponent(),
//         helmet.base.toComponent(),
//         helmet.meta.toComponent(),
//         helmet.link.toComponent(),
//         helmet.noscript.toComponent(),
//         helmet.script.toComponent(),
//         helmet.style.toComponent(),
//     ])
// }

// Load Analytics & Sort meta tags
export const onPreRenderHTML = ({
    getHeadComponents,
    replaceHeadComponents,
    replacePreBodyComponents,
    getPreBodyComponents
}) => {
    const order = ["title", "base", "meta", "link", "noscript", "script", "style"]

    const sortedHeadComponents = getHeadComponents()
        .concat([<LoadScripts />])
        .slice(0)
        .flat()
        .sort((x, y) => order.indexOf(x.type) - order.indexOf(y.type));

    replaceHeadComponents(sortedHeadComponents);
    replacePreBodyComponents(getPreBodyComponents()
        .concat([<GtmNoScript />])
    );
}
