export { wrapRootElement } from "./wrap-root-element";

const onPreRouteUpdate = ({ location }) => {
    if (window.dataLayer) {
        window.dataLayer.push({
            event: 'pageview',
            category: 'pageview',
            action: 'pageview',
            url: location.pathname
        });
    }
    else if (window) {
        window.dataLayer = [{
            event: 'pageview',
            category: 'pageview',
            action: 'pageview',
            url: location.pathname
        }]
    }
}

export { onPreRouteUpdate };
