const bookModel = require('../models/bookModel');
const reviewModel = require('../models/reviewModel');
const userModel = require('../models/userModel');
const validators = require('../validators/validator');

const createReview = async function(req,res)
{
    try
    {
        if(!validators.isValidRequestBody(req.body))
            return res.status(400).send({status : false, message : "Invalid request body. Please provide review details."});
        
        if(req.params.bookId!=undefined)
            return res.status(400).send({status : false, message : "bookId is required."});
        
        const bookId = req.params.bookId;
        
        if(!validators.isValidObjectId(bookId))
            return res.status(400).send({status : false, message : "The given bookId is not a valid ObjectId."})
        
        let bookExists = await bookModel.findOne({_id : bookId, isDeleted : false});
        
        if(!bookExists)
            return res.status(404).send({status : false, message : "Book not found!"});
        
        let {review,rating,reviewedBy} = req.body;

        if(!validators.isValidField(review))
            return res.status(400).send({status : false, message : "review is required."});

        if(!validators.isValidField(rating))
            return res.status(400).send({status : false, message : "rating is required."});
        
        if(/[1-5]/.test(rating))
            return res.status(400).send({status : false, message : "rating should be a number from 1 to 5."});

        if(!validators.isValidField(reviewedBy))
            return res.staus(400).send({status : false, message : "reviewedBy is required."});

        let userExists = await userModel.findOne({name : reviewedBy, isDeleted: false});

        if(!userExists)
            reviewedBy='Guest';
 
        const reviewData = {bookId,reviewedBy,reviewedAt : new Date(),rating,review};

        const newReview = await reviewModel.create(reviewData);
        
        await bookModel.findOneAndUpdate({_id : bookId, isDeleted : false},{$inc : {rating : 1}});

        return res.status(201).send({status : true,message : "Review created successfully.", data : newReview});
    }
    catch(error)
    {
        return res.status(500).send( { status : false, message : error.message } );
    }
};

const updateReview = async function(req,res)
{
    try
    {
        if(req.params.bookId!=undefined)
            return res.status(400).send({status : false, message : "bookId is required."});
    
        const bookId = req.params.bookId;
        
        if(!validators.isValidObjectId(bookId))
            return res.status(400).send({status : false, message : "The given bookId is not a valid ObjectId."})
        
        let bookExists = await bookModel.findOne({_id : bookId, isDeleted : false});

        if(!bookExists)
            return res.status(404).send({status : false, message : "Book not found!"});

        if(req.params.reviewId===undefined)
            return res.status(400).send({status : false, message : "Invalid request parameter. Please provide reviewId."});
        
        const reviewId = req.params.reviewId;
            
        if(!validators.isValidObjectId(reviewId))
            return res.status(400).send({status : false, message : "The given bookId is not a valid ObjectId."});
        
        let reviewExists = await reviewModel.findOne({_id : reviewId,bookId,isDeleted : false});
        
        if(!reviewExists)
            return res.status(404).send({status : false,message : "Review not found!"});
        
        let user = await userModel.findOne({name : reviewExists.reviewedBy, isDeleted : false},{_id : 1});

        let decodedToken = req.validtoken;

        if(decodedToken._id!==user._id)
            return res.status(403).send({ status : false, message : "Unauthorized access! Owner info does not match." });

        if(!validators.isValidRequestBody(req.body))
            return res.status(400).send({status : false, message : "Invalid request body. Please provide review details to be updated in request body."});
        
        
    }
    catch(error)
    {
        return res.status(500).send({status : false, message : error.message});
    }
};

const deleteReview = async function(req,res)
{
    try
    {
        
    if(req.params.bookId!=undefined)
        return res.status(400).send({status : false, message : "bookId is required."});
    
    const bookId = req.params.bookId;
    
    if(!validators.isValidObjectId(bookId))
        return res.status(400).send({status : false, message : "The given bookId is not a valid ObjectId."})
    
    let bookExists = await bookModel.findOne({_id : bookId, isDeleted : false});
    
    if(!bookExists)
        return res.status(404).send({status : false, message : "Book not found!"});
        
    if(req.params.reviewId===undefined)
        return res.status(400).send({status : false, message : "Invalid request parameter. Please provide reviewId."});
        
    const reviewId = req.params.reviewId;
        
    if(!validators.isValidObjectId(reviewId))
        return res.status(400).send({status : false, message : "The given bookId is not a valid ObjectId."});
    
    let reviewAlreadyExists = await reviewModel.findOne({_id : reviewId,bookId,isDeleted : false});
    
    if(!reviewAlreadyExists)
        return res.status(404).send({status : false,message : "Review not found!"});
    
    await reviewModel.findByIdAndUpdate(reviewId,{$set : {isDeleted : true}});
    
    await bookModel.findByIdAndUpdate(bookId,{$inc : {rating : -1}});

    return res.status(200).send({status : true, message : "review deleted successfully."});
    }
    catch(error)
    {
        return res.status(500).send({status : false, message : error.message});
    }
};

module.exports={createReview,updateReview,deleteReview};