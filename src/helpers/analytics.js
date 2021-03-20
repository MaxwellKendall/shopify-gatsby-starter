/**
 * logEvent
 * @param {string} category 
 * @param {string} action 
 * @param {string} label 
 * @param {string} value 
 * checks for value on window -- does null check, establishes data layer if its not there etc...
 */

export const logEvent = ({
    category,
    action,
    label,
    value = ''
}) => {
    if (window.dataLayer) {
        window.dataLayer.push({
            event: 'event',
            category,
            action,
            label,
            value
        });
    }
    else if (window) {
        window.dataLayer = [{
            event: 'event',
            category,
            action,
            label,
            value
        }]
    }
}