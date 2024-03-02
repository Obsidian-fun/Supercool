
export function validateRegister(req,res,next){
  if (!req.body.username || req.body.username.length < 3){
    console.log(req.body.username, req.body.username.length);
    return res.status(400).send({
      message:'Username should be greater than 3 characters',
    });
  }
  if (!req.body.password || req.body.password.length < 8){
    return res.status(400).send({
      message:'Password must be atleast 8 characters',
    });
  }
  next();
}
