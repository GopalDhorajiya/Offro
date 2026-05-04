const userResponse = {
  id: "",
  name: "",
  phoneNumber: "",
  offers: [],
};

userResponse.fromUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    phoneNumber: user.phoneNumber,
    offers: user.offers || [],
  };
};

export default userResponse;
