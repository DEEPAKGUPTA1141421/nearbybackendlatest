const driver = require("../config/neo4j");
const customError = require("../middleware/customError");
module.exports.updateUserAndAddressInfo = async (userId, updatedInfo) => {
  const session = driver.session();
  const tx = session.beginTransaction();

  try {
    // Update User Information
    let setClause = [];
    let params = { userId: userId };

    if (updatedInfo.fullname) {
        setClause.push("u.fullname = $fullname");
        params.fullname = updatedInfo.fullname;
      }
      if (updatedInfo.contactNumber) {
          setClause.push("u.contactNumber = $contactNumber");
          params.contactNumber = updatedInfo.contactNumber;
      }
      if (updatedInfo.email) {
        setClause.push("u.email = $email");
        params.email = updatedInfo.email;
      }
      if (updatedInfo.image) {
        setClause.push("u.image = $image");
        params.image = updatedInfo.image;
      }

    if (setClause.length > 0) {
      await tx.run(
        `
        MATCH (u:User)
        WHERE elementId(u) = $userId
        SET ${setClause.join(", ")}
        RETURN u
        `,
        params
      );
    }

    // Update Address Information
    setClause = [];
     params = { userId: userId };

    if (updatedInfo.country) {
        setClause.push("a.country = $country");
        params.country = addressInfo.country;
      }
      if (updatedInfo.city) {
        setClause.push("a.city = $city");
        params.city = addressInfo.city;
      }
      if (updatedInfo.address1) {
        setClause.push("a.address1 = $address1");
        params.address1 = addressInfo.address1;
      }
      
      if (updatedInfo.address2) {
        setClause.push("a.address2 = $address2");
        params.address2 = addressInfo.address2;
      }
      if (updatedInfo.postalCode) {
        setClause.push("a.postalCode = $postalCode");
        params.postalCode = addressInfo.postalCode;
      }
      if (updatedInfo.addressType){
        setClause.push("a.addressType = $addressType");
        params.addressType = addressInfo.addressType;
      }

    if (setClause.length > 0) {
      await tx.run(
        `
        MATCH (u:User)-[:address_list]->(a:Address)
        WHERE elementId(u) = $userId
        SET ${setClause.join(", ")}
        RETURN a
        `,
        params
      );
    }

    await tx.commit();
    session.close();

    return { message: "User and address updated successfully",success:true };
  } catch (err) {
    await tx.rollback();
    session.close();
  }
};
module.exports.findShopByEmail=async(req,res)=>{
  const session = driver.session();
  const userId = req.user.elementId;
  try {
    const user = await session.run(
      `
        MATCH (u:User)
        WHERE elementId(u) = $id
        RETURN u
        `,
      { id:userId }
    );
    let userNode;
    if (user.records.length >0) {
       userNode = user.records[0].get("u");
       return userNode.properties.email
    }
  }
  catch(err){
     next(new customError(err.message,404));
  }
}
