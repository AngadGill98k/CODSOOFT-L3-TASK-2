const mongoose = require('mongoose');

// Define the schema for a todo item
const TodoSchema = new mongoose.Schema({
    name:String,
    created:[{
        todo:String,
        user:[String],
    }],
    in_prog:[{
        todo:String,
        user:[String],
    }],
    done:[{
        todo:String,
        user:[String],
    }],
    members:[String],
});


// Create the model
const Todo = mongoose.model('Todo', TodoSchema);

module.exports = Todo;
