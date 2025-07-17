let add_proj_btn = document.querySelector('#add-project')
let draggable_todo = null
let url = "http://localhost:3000/"
let username = "asd"
retrieve()
let dragFrom = null
let dragTo = null;
let actproj

async function getname(id) {
  return fetch('http://localhost:3000/getname', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id })
  })
  .then(res => res.json())
  .then(data => {
    console.log(data); // ✅ Shows { name: "..." }
    return data.name;  // ✅ This now goes back to caller
  })
  .catch(err => {
    console.error(err);
    return id; // fallback
  });
}


async function getUserInfo(idArray) {
  try {
    let results = await Promise.all(
      idArray.map(async (id) => {
        console.log("id is ",id)
        try {
          let res = await fetch(`http://localhost:3000/get_user_by_id`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id }),
          });
          let data = await res.json();
          console.log(data)
          return data.name ;
        } catch (err) {
          console.error(`Error fetching user info for ${id}:`, err);
          
        }
      })
    );
    return results; // array of names
  } catch (err) {
    console.error("Error in getUserInfo:", err);
    return idArray; // fallback
  }
}


async function retrieve() {
    
    let project
    await fetch(`http://localhost:3000/ret_proj`, {
        method: 'POST',
        body: JSON.stringify(),
        credentials:'include',
        headers: {
            'Content-Type': 'application/json',
        } 
    })
        .then(res => res.json())
        .then(data => {
            console.log(data.msg)
            console.log(" retriving ", data.project)
            project = data.project
            d_project(project)
        })
}
async function d_project(projects) {
    let list_area = document.querySelector('#project_lis');
    list_area.innerHTML = '';
    console.log("Giving ID to the project and appending", projects);

    for (let value of projects) {
        let proj_todo = "Loading...";
        console.log('id being sent', value)
        try {
            let res = await fetch(`http://localhost:3000/ret_proj_todos`, {
                method: 'POST',
                body: JSON.stringify({ value }),
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            let data = await res.json();
            console.log(data)
            proj_todo = data.todo || "No todo found";

        } catch (err) {
            console.error("Fetch failed for", value._id, err);
            proj_todo = "Error fetching todo";
        }

        let item = document.createElement('li'); 
        item.setAttribute('id', proj_todo._id);
        item.setAttribute('created', JSON.stringify(proj_todo.created));
        item.setAttribute('done', JSON.stringify(proj_todo.done));
        item.setAttribute('in_prog', JSON.stringify(proj_todo.in_prog));
        item.setAttribute('name', proj_todo.name);
        item.setAttribute('members', JSON.stringify(proj_todo.members));
        item.textContent = proj_todo.name;


        item.addEventListener('click', handleClick);


        list_area.appendChild(item);
    }
}

async function hnadlemember() {
    let member = document.querySelector('#member')
    member = member.value
    await fetch(`http://localhost:3000/member`, {
        method: 'POST',
        body: JSON.stringify({ member, actproj }),
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(res => res.json())
        .then(data => {
            console.log(data.msg)
            let project = document.querySelector(`[id="${actproj}"]`);
            let existing = JSON.parse(project.getAttribute('members') || '[]');
            if (!existing.includes(data.id)) {
                existing.push(data.id); // Avoid duplicates if needed
            }
            project.setAttribute('members', JSON.stringify(existing));
            console.log(project)
        })
}

let handleClick = (e) => {
    let project = e.currentTarget;
    let id = project.getAttribute('id');
    let name = project.getAttribute('name');
    actproj = id
    let created = JSON.parse(project.getAttribute('created') || '[]');
    let done = JSON.parse(project.getAttribute('done') || '[]');
    let inProgress = JSON.parse(project.getAttribute('in_prog') || '[]');
    let members = JSON.parse(project.getAttribute('members') || '[]');

    project = {
        id, name, created, done, inProgress, members
    };
    console.log("Clicked on project name:", name);
    let main_area = document.querySelector('#main-area');
    console.log("main")
    main_area.innerHTML = `
     <div>
        <input type='text' placeholder='name' id='member'></input>
    <button onclick="hnadlemember()">add people</button>
        <ul id="mem_l">

        </ul>
    </div>
    <div class="todoadd">
        <input id="input" type="text" placeholder="add a task">
        <button id="add">add</button>
    </div>

    <div class="grid">
        <div id="first">
            <div id="first-head">todos</div>
            <ul class="todos-1">
            </ul>
        </div>

        <div id="second">
            <div id="sec-head">in-progress</div>
            <ul class="todos-2">
            </ul>
        </div>

        <div id="third">
            <div id="third-head">done</div>
            <ul class="todos-3">
            </ul>
        </div>
    </div>
`;

    displaying(project)
    setupDragAndDrop();
    attachTodoEventListener(project);
}
add_proj_btn.addEventListener('click', () => {

    let input = document.querySelector('#project_name')
    let input_value = input.value.trim()
    if (input_value == "") {
        console.log("enter valid input")
    } else {
        console.log("add btn working")
       
        project_name = input_value
      
        fetch("http://localhost:3000/project_name", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ project_name })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // console.log(data.msg, data.todo, data.user);
                retrieve(data.user)

            })
    }
   
})
async function addtodo(project) {
    let input = document.querySelector('#input')
    let input_value = input.value.trim()

    if (input_value == "") {
        console.log("enter valid input")
    } else {
        await fetch(`http://localhost:3000/add_proj_todo`, {
            method: 'POST',
            body: JSON.stringify({ id: project.id, input: input_value }),
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("adding a todo", data.msg)
                console.log("dsiplayin todo", data.todo)
                let project = {
                    created: data.todo.created || [],
                    done: data.todo.done || [],
                    inProgress: data.todo.in_prog || [],
                    members: data.todo.members || [],
                    name: data.todo.name,
                    id: data.todo._id
                };
                console.log("testing", project)
                displaying(project)
            })
    }
}
async function displaying(project) {
    let created = document.querySelector('.todos-1');
    let inprog = document.querySelector('.todos-2');
    let done = document.querySelector('.todos-3');

    created.innerHTML = '';
    inprog.innerHTML = '';
    done.innerHTML = '';

    (project.created || []).forEach(async task => {
        let li = document.createElement('li');
        li.textContent = task.todo || 'Untitled';

        let btn = document.createElement('button');
        btn.textContent = 'assign';
        btn.addEventListener('click', (e) => handleassignment(project.members, e));

        li.appendChild(btn);
        li.setAttribute('id', task._id);
        li.setAttribute('name', task.todo);
        li.setAttribute('user', JSON.stringify(task.user || []));
        li.setAttribute('status', 'created');
        li.setAttribute('project-id', project.id);
        li.setAttribute('members', JSON.stringify(project.members));
        li.setAttribute('assigned', JSON.stringify(task.user || []));
        li.setAttribute('draggable', 'true');

        li.addEventListener('dragstart', () => {
            draggable_todo = li;
            dragFrom = li.parentElement.className;
        });
        console.log(task.user)
        let name=await getUserInfo(task.user)
         console.log(name)
        let div = document.createElement('div');
         div.innerText = 'Assigned to ' + (name || []).join(', ');
        li.appendChild(div);

        created.appendChild(li);
    });

    (project.inProgress || []).forEach(async task => {
        let li = document.createElement('li');
        li.textContent = task.todo || 'Untitled';

        let btn = document.createElement('button');
        btn.textContent = 'assign';
        btn.addEventListener('click', (e) => handleassignment(project.members, e));

        li.appendChild(btn);
        li.setAttribute('id', task._id);
        li.setAttribute('name', task.todo);
        li.setAttribute('user', JSON.stringify(task.user || []));
        li.setAttribute('status', 'inProgress');
        li.setAttribute('project-id', project.id);
        li.setAttribute('members', JSON.stringify(project.members));
        li.setAttribute('assigned', JSON.stringify(task.user || []));
        li.setAttribute('draggable', 'true');

        li.addEventListener('dragstart', () => {
            draggable_todo = li;
            dragFrom = li.parentElement.className;
        });
     console.log(task.user)
        let div = document.createElement('div');
        let name=await getUserInfo(task.user)
         console.log(name)
         div.innerText = 'Assigned to ' + (name || []).join(', ');
        li.appendChild(div);

        inprog.appendChild(li);
    });

    (project.done || []).forEach( async task => {
        let li = document.createElement('li');
        li.textContent = task.todo || 'Untitled';

        let btn = document.createElement('button');
        btn.textContent = 'assign';
        btn.addEventListener('click', (e) => handleassignment(project.members, e));

        li.appendChild(btn);
        li.setAttribute('id', task._id);
        li.setAttribute('name', task.todo);
        li.setAttribute('user', JSON.stringify(task.user || []));
        li.setAttribute('status', 'done');
        li.setAttribute('project-id', project.id);
        li.setAttribute('members', JSON.stringify(project.members));
        li.setAttribute('assigned', JSON.stringify(task.user || []));
        li.setAttribute('draggable', 'true');

        li.addEventListener('dragstart', () => {
            draggable_todo = li;
            dragFrom = li.parentElement.className;
        });
     console.log(task.user)
         let div = document.createElement('div');
        let name=await getUserInfo(task.user)
        console.log(name)
         div.innerText = 'Assigned to ' + (name || []).join(', ');
        li.appendChild(div);

        done.appendChild(li);
    });
}

let handleassignment = async (members, e) => {
    let button = e.currentTarget;
    let todo = button.parentElement;

    let id = todo.getAttribute('id');
    let name = todo.getAttribute('name');
    let user = JSON.parse(todo.getAttribute('user') || '[]');
    let status = todo.getAttribute('status');
    let projectId = todo.getAttribute('project-id');
    let assigned = JSON.parse(todo.getAttribute("assigned") || '[]');

    // ✅ Fetch latest members from backend
    let updatedMembers = [];
    try {
        let res = await fetch(`http://localhost:3000/project_members_cuureently`, {
            method: 'POST',
            body: JSON.stringify({ projectId }),
            headers: {
                'Content-Type': 'application/json',
            }
        });
        let data = await res.json();
        updatedMembers = data.members;  // expect server to return { members: [...] }
    } catch (err) {
        console.error('Failed to fetch project members:', err);
        updatedMembers = members; // fallback to existing
    }

    // ✅ Then show the modal with the freshest data
    showAssignmentModal(assigned, updatedMembers, projectId, id, todo);
};

function showAssignmentModal(assigned, members, projectId, todoId, todoElem) {
    let oldModal = document.getElementById('assignmentModal');
    if (oldModal) oldModal.remove();

    let overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'assignmentModal';

    let content = document.createElement('div');
    content.className = 'modal-content';

    let closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = 'X';
    closeBtn.onclick = () => overlay.remove();
    
    let assignedList = document.createElement('ul');
    assignedList.id = 'assigned_to';
    assigned.forEach(async id => {
        console.log(id)
        let name=await getname(id)
        let li = document.createElement('li');
        li.textContent = `already assigned to ${name}`;
        assignedList.appendChild(li);
    });

    let assignmentList = document.createElement('ul');
    assignmentList.id = 'assignment';
    members.forEach(async memberId => {
        console.log(memberId);
        let name=await getname(memberId)
        let li = document.createElement('li');
        li.textContent = `Assign to user: ${name}`;
        li.onclick = async () => {
            let res = await fetch(`http://localhost:3000/selected`, {
                method: 'POST',
                body: JSON.stringify({ memberId, projectId, id: todoId }), 
                headers: { 'Content-Type': 'application/json' }
            });
            let data = await res.json();
            console.log(data.msg); 

            if (!assigned.includes(memberId)) {
                assigned.push(memberId);
                todoElem.setAttribute('assigned', JSON.stringify(assigned));
            }
            // update or create the assigned display <div>
let assignedDiv = todoElem.querySelector('.assigned-display');
if (!assignedDiv) {
    assignedDiv = document.createElement('div');
    assignedDiv.className = 'assigned-display';
    todoElem.appendChild(assignedDiv);
}
assignedDiv.textContent = 'Assigning to: ' + name;

            // Update assigned list
            assignedList.innerHTML = '';
            assigned.forEach(id => {
                let li = document.createElement('li');
                li.textContent = id;
                assignedList.appendChild(li);
            });
               overlay.remove();
        };
        assignmentList.appendChild(li);
    });
 
    content.appendChild(closeBtn);
    content.appendChild(assignedList);
    content.appendChild(assignmentList);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
}

async function setupDragAndDrop() {
    let first = document.querySelector('#first')
    let second = document.querySelector('#second')
    let third = document.querySelector('#third')

    first.addEventListener('dragover', (e) => {
        console.log("drag over1")
        e.preventDefault()
    })
    first.addEventListener('drop', async (e) => {
        if (draggable_todo) {
            dragTo = first.querySelector('ul').className;
            console.log(`Moved from ${dragFrom} to ${dragTo}`);
            first.querySelector('ul').appendChild(draggable_todo)
            draggable_todo.setAttribute('status', 'created')
            let droppedItem = draggable_todo;
            let temp = {
                subId: droppedItem.getAttribute('id'), // subtask _id
                name: droppedItem.getAttribute('name'),
                user: JSON.parse(droppedItem.getAttribute('user') || '[]'),
                status: 'created', // or created/done
                projectId: droppedItem.getAttribute('project-id')
            };


            console.log("object attributes bieng ropped:", temp);
            try {
                let res = await fetch("http://localhost:3000/update_status", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(temp)
                });
                let data = await res.json();
                console.log("Server response:", data);
            } catch (err) {
                console.error("Error sending status update:", err);
            }
            draggable_todo = null;




        }


    })

    second.addEventListener('dragover', (e) => {
        console.log("drag over2")
        e.preventDefault()
    })
    second.addEventListener('drop', async (e) => {
        if (draggable_todo) {
            dragTo = second.querySelector('ul').className;
            console.log(`Moved from ${dragFrom} to ${dragTo}`);
            second.querySelector('ul').appendChild(draggable_todo)
            draggable_todo.setAttribute('status', 'in_prog')
            let droppedItem = draggable_todo;
            let temp = {
    subId: droppedItem.getAttribute('id'), // subtask _id
    name: droppedItem.getAttribute('name'),
    user: JSON.parse(droppedItem.getAttribute('user') || '[]'),
    status: 'in_prog', // or created/done
    projectId: droppedItem.getAttribute('project-id')
};


            console.log("object attributes bieng ropped:", temp);
            try {
                let res = await fetch("http://localhost:3000/update_status", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(temp)
                });
                let data = await res.json();
                console.log("Server response:", data);
            } catch (err) {
                console.error("Error sending status update:", err);
            }
            draggable_todo = null;

        }
    })

    third.addEventListener('dragover', (e) => {
        console.log("drag over3")
        e.preventDefault()
    })
    third.addEventListener('drop', async (e) => {
        if (draggable_todo) {
            dragTo = third.querySelector('ul').className;
            console.log(`Moved from ${dragFrom} to ${dragTo}`);
            third.querySelector('ul').appendChild(draggable_todo)
            draggable_todo.setAttribute('status', 'done')
            let droppedItem = draggable_todo;
            let temp = {
    subId: droppedItem.getAttribute('id'), // subtask _id
    name: droppedItem.getAttribute('name'),
    user: JSON.parse(droppedItem.getAttribute('user') || '[]'),
    status: 'done', // or created/done
    projectId: droppedItem.getAttribute('project-id')
};

            try {
                let res = await fetch("http://localhost:3000/update_status", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(temp)
                });
                let data = await res.json();
                console.log("Server response:", data);
            } catch (err) {
                console.error("Error sending status update:", err);
            }
            console.log("object attributes bieng ropped:", temp);
            draggable_todo = null;

        }
    })
}
function attachTodoEventListener(project) {
    let add_todo_btn = document.querySelector('#add')
    add_todo_btn.addEventListener('click', () => addtodo(project))
   
}


