let express = require('express');
let app = express();
let port = 3000;
let path = require('path')
let User = require('./models/user.js')
let Todo = require('./models/todo.js')
let mongoose = require('mongoose');
let bcrypt = require('bcrypt');
let session = require('express-session');
let MongoStore = require('connect-mongo');
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let cors = require('cors');
let { log } = require('console');
mongoose.connect('mongodb://127.0.0.1:27017/todo')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/todo' }),
    cookie: { maxAge: 1000 * 60 * 60 } 
}));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',  
    credentials: true                
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'todo.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.use(passport.initialize());
app.use(passport.session());
 
passport.use(new LocalStrategy(
  { usernameField: 'mail' },
  async (mail, password, done) => {
    let user = await User.findOne({ mail });
    if (!user) return done(null, false, { message: 'User not found' });
    
    let match = await bcrypt.compare(password, user.password);
    console.log(match)
    if (!match) return done(null, false, { message: 'Wrong password' });

    return done(null, user);
  }
  
));

passport.serializeUser((user, done) => {
  done(null, user._id); 
});

passport.deserializeUser(async (id, done) => {
  let user = await User.findById(id);
  done(null, user);
});

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ msg: 'You must be logged in' });
}
app.post('/signup', async (req, res) => {
    let data = req.body
    let hashed=await bcrypt.hash(data.pass,10);
    let user = new User({
        user_name: data.username,
        password: hashed,
        mail: data.mail,
        todo: []
    })
    await user.save()
    res.json({ msg: 'user save' })
})


app.post('/signin', passport.authenticate('local'), (req, res) => {
  res.json({ msg: 'Logged in successfully'});
});
app.post('/project_name',ensureAuth, async (req, res) => {
    let { project_name } = req.body; 
    let userid=req.user
    let user = await User.findOne({ _id: userid })
    let todo = new Todo({
        created: [],
        in_prog: [],
        done: [],
        name: project_name,
        members: [user._id]
    })
    todo.save()

    user.todo.push(todo._id)
    user.save()
    res.json({ msg: "saved", user, todo })

  
});
app.post('/ret_proj',ensureAuth, async (req, res) => {
    let userid=req.user
    let user = await User.findOne({ _id: userid })

    res.json({ msg: "saved", project: user.todo })
})
app.post('/ret_proj_todos',ensureAuth, async (req, res) => {
    let { value } = req.body; 
    let todo = await Todo.findOne({ _id: value })
    //console.log(todo)
    res.json({ todo }) 
})
app.post('/add_proj_todo',ensureAuth, async (req, res) => {
    let { id, input } = req.body; 
    let todo = await Todo.findOne({ _id: id })

    todo.created.push({
        todo: input,
        user: [],
    })
    todo.save()

    res.json({ msg: "added to ptoj", todo })
})
app.post('/member',ensureAuth, async (req, res) => {
    let { member, actproj } = req.body;
    try {
        let project = await Todo.findById(actproj);
        let user = await User.findOne({ user_name: member });

        if (!user || !project) {
            return res.status(404).json({ msg: "User or Project not found" });
        }

   
        if (!project.members.includes(user._id.toString())) {
            project.members.push(user._id);
            await project.save();
        }

        if (!user.todo.includes(actproj)) {
            user.todo.push(actproj);
            await user.save();
        }

        console.log("Added member and project:", user._id, actproj);
        res.json({ msg: "saved", id: user._id });

    } catch (err) {
        console.error("Error in /member:", err);
        res.status(500).json({ msg: "Internal server error" });
    }
});

app.post('/selected', ensureAuth,async (req, res) => {
    let { memberId, projectId, id } = req.body; 
    let project = await Todo.findOne({ _id: projectId })
    let allTasks = [...project.created, ...project.in_prog, ...project.done];
    console.log(memberId,projectId,id)
    console.log("alltask",allTasks)
  
    let found = allTasks.find(t => t._id.toString() === id);

    console.log("found",found)
    if (!found) return res.status(404).json({ msg: 'Task not found' });

    console.log("Found task:", found);

    
    if (!found.user.includes(memberId)) {
        found.user.push(memberId);
        project.save()
        res.json({ msg: "saved" })
    }

    
})
app.post('/update_status',ensureAuth, async (req, res) => {
    let { subId, name, user, status, projectId } = req.body;
    try {
        let project = await Todo.findById(projectId);
        if (!project) return res.status(404).json({ msg: "Project not found" });

    
        project.created = project.created.filter(t => String(t._id) !== String(subId));
        project.in_prog = project.in_prog.filter(t => String(t._id) !== String(subId));
        project.done = project.done.filter(t => String(t._id) !== String(subId));

      
        let newTask = { _id: subId, todo: name, user };
        if (status === 'created') project.created.push(newTask);
        else if (status === 'in_prog') project.in_prog.push(newTask);
        else if (status === 'done') project.done.push(newTask);

        await project.save();
        res.json({ msg: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal server error' });
    }
});

app.post('/project_members_cuureently',ensureAuth, async (req, res) => {
    let { projectId } = req.body;
    let project = await Todo.findById(projectId);
    res.json({ members: project.members || [] });
});
app.post('/get_user_by_id',ensureAuth, async (req, res) => {
  let  {id}  = req.body;
console.log("sdfsdfsd",id)
  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    let user = await User.findOne({_id:id});
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log("user founded with id is ",user.user_name);
    res.json({ name: user.user_name });
  } catch (err) {
    console.error('Error retrieving user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/getname', ensureAuth, async (req, res) => {
  try {
    let { id } = req.body;
    // Your logic here
    let user= await User.findOne({_id:id})
    let name=user.user_name
    res.status(201).json({ message: 'POST success',name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
