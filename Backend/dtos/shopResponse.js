
const shopResponse = {
    id: "",
    name: "",
    email: "",
    phoneNumber: ""
}

shopResponse.fromShop = (shop) => {
    // return shopResponse.buider()._id(shop._id).address(shop.address).category(shop.category).description(shop.description).email(shop.email).name(shop.name).owner_name(shop.owner_name).phoneNumber(shop.phoneNumber).profileImageUrl(shop.profileImageUrl).shopLocation(shop.shopLocation);
    return {
        id: shop._id,
        name: shop.name,
        email: shop.email,
        phoneNumber: shop.phoneNumber
    }
}

export default shopResponse;