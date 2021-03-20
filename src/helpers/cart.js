export const totalItemsInCart = ({ lineItems }) => {
    return lineItems.reduce((acc, { quantity }) => {
        return acc + quantity;
    }, 0);
}