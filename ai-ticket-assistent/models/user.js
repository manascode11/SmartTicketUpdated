// // import mongoose from "mongoose";

// // const userSchema = new mongoose.Schema({
// //   email: { type: String, required: true, unique: true },
// //   password: { type: String, required: true },
// //   role: { type: String, default: "user", enum: ["user", "moderator", "admin"] },
// //   skills: [String],
// //   createdAt: { type: Date, default: Date.now },
// // });

// // export default mongoose.model("User", userSchema);
// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { 
//     type: String, 
//     enum: ["user", "moderator", "admin"], 
//     default: "user" 
//   },
//   skills: [String] 
// });

// export default mongoose.model("User", userSchema);
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["user", "moderator", "admin"], 
    default: "user" 
  },
  skills: { type: [String], default: [] }
});
const User = mongoose.model("User", userSchema);
export default User;