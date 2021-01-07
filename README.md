# To Do Plus

To Do Plus is a MERN (Mongo-Express-React-NodeJS) app designed to help user (specifically students) to better manage their time and tasks to boost productivity and to develop better study/work habits.


## Demo:

You can use the live app at the following url: <https://todoplus.app/>

## Approach

To Do Plus was built to solve the problem of effective time and task management. The backend was built first to process user data such as creating new users and storing user data based on the User Schema. Next, the front end was built to capture and display relevant user data. A minimalist approach was chosen for the front to display only relevant data and controls (such as buttons, forms, labels) to help the user focus more on the tasks they have to work on.

For task management, the user can organize work in terms of the following, which can be edited, deleted, or marked as completed:

- **Projects**: Long lead and more general items (like a Homework Assignment)

- **Tasks**: More specific items such as User login, on which the user can start **Productivity Sessions** by clicking the timer icon.

- **Subtasks**: Even more specific steps to complete the task such as Masking passwords.

For time management, the user must set a **Weekly Productivity Goal** which is broken down into **Daily Goals**. A weekly goal must be set only once, but Daily Goals will need to set every day - the user will be prompted for these automatically on login.

Daily productivity goals are shown in the **Productivity Meter** in the top left corner as a percentage, which will alwsy be 0% at the start of the day. The user should try to fill up the meter to 100% by starting productivity sessions during which they are supposed to work on the selected task.

The **Stats** page displays the user's progress for the past 7 days, including the current day, in a bar chart. The grey bars represent the user's goal and the gold bars represent the user's actual productivity achieved and a percentage showing how much of the goal was achieved. The gold bars can be clicked to show additional details of exactly what the user worked on for that date.

## Built With

- NodeJS: Backbone of the app.

- Express: Backend routing solution.

- Mongoose (MongoDB): Used for data persistence via mLab.

- React: The front end is done completely in React along with React Router.

- MomentJS: Used for processing, storing, and displaying time.

- ReactVIS: Used to data visualization and charts.

- Auth0: Used for user authentication.

## Syntax and Conventions

The app is written in ES6. 
