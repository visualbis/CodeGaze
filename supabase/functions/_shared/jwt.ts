import * as djwt from "https://deno.land/x/djwt@v2.2/mod.ts";
const { create, getNumericDate, verify } = djwt


const algorithm = "HS512"
export const createJWT = async (data, duration : number) => {
    const DURATION = (duration !== 0 && duration !== null ? 60 * duration : 60 * 60 * 2);
    return await create({ alg: algorithm, typ: "JWT" }, { ...data, exp: getNumericDate(DURATION) }, Deno.env.get('JWT_SECRET'))
}

export const verifyJWT = async (token) => {
    return await verify(token, Deno.env.get('JWT_SECRET'), algorithm)
}