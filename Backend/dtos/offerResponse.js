const offerResponse = {
    fromOffer: (offer) => {
        return {
            id: offer._id.toString(),
            shop: offer.shop,
            benefitType: offer.benefitType,
            constraintType: offer.constraintType,
            image: offer.image,
            applicableProducts: offer.applicableProducts,
            startTime: offer.startTime,
            endTime: offer.endTime,
            discount: offer.discount,
            buyQty: offer.buyQty,
            getQty: offer.getQty,
            totalSlots: offer.totalSlots,
            filledSlots: offer.filledSlots,
            participants: offer.participants || [],
            isActive: offer.isActive,
            status: offer.status, // virtual
            remainingSlots: offer.remainingSlots, // virtual
            createdAt: offer.createdAt,
            updatedAt: offer.updatedAt
        };
    },
    fromOfferList: (offers) => {
        return offers.map(offer => offerResponse.fromOffer(offer));
    }
};

export default offerResponse;
