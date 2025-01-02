import jwt from "jsonwebtoken"

const GenerateToken = (data) => {
    const token = jwt.sign({data},process.env.JWT_SECRET,{
        expiresIn:'168h'
    })
    return token;
}

export default GenerateToken;