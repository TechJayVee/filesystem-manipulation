const fs = require("fs/promises");

(async () => {
  //constant commands
  const CREATE_FILE = "MAKE FILE:";
  const UPDATE_FILE = "UPDATE FILE:";
  const RENAME_FILE = "RENAME FILE:";
  const DELETE_FILE = "DELETE FILE:";
  //open the file  and read its content
  const commandFilehandler = await fs.open("./command.txt", "r");

  //handler
  const makeFile = async (path) => {
    try {
      const existingFileHandler = await fs.open(path, "r");
      existingFileHandler.close();
      return console.log(`the file ${path}  already exists.`);
    } catch (error) {
      const newFilehandler = await fs.open(path, "w");
      console.log(`a new file ${path} sucessfully created`);
      newFilehandler.close();
    }
  };

  const addToFile = async (path, content) => {
    try {
      const fileHandler = await fs.open(path, "a");
      fileHandler.write(content);
      fileHandler.close();
      return console.log(`adding to file ${path}  the content ${content}`);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`The file you are trying to add content does not exist`);
      } else {
        console.log("an error occured while appending to the file", error);
      }
    }
  };
  const deleteFile = async (path) => {
    try {
      console.log(path);
      await fs.unlink(path);
      return console.log(`successfully deleted ${path}`);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log("The file you are trying to delete does not exist");
      } else {
        console.log("an error occured while removing the file", error);
      }
    }
  };
  const renameFile = async (oldPath, newPath) => {
    try {
      await fs.rename(oldPath, newPath);
      await fs.stat(newPath);
      return console.log(`rename file ${oldPath} to ${newPath} successfully`);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(
          `There was an error renaming the file ${oldPath} to ${newPath}`
        );
      } else {
        console.log("an error occured while renaming the file", error);
      }
    }
  };
  //event
  commandFilehandler.on("change", async () => {
    const size = (await commandFilehandler.stat()).size; //get the size of the actual file (content lenght)
    const buff = Buffer.alloc(size); //allocate the size to  a buffer
    const offset = 0;
    const position = 0; //start reading file from beginning
    const length = buff.byteLength; // bytes we want to read
    await commandFilehandler.read(buff, offset, length, position);
    const command = buff.toString("utf-8");

    if (command.includes(CREATE_FILE)) {
      console.log("create a file");
      const filePath = command.substring(CREATE_FILE.length + 1);
      makeFile(filePath);
    } else if (command.includes(UPDATE_FILE)) {
      console.log("update a file");
      const idx = command.indexOf(" this content: ");
      const filePath = command.substring(UPDATE_FILE.length + 1, idx);
      const content = command.substring(idx + 15);
      addToFile(filePath, content);
    } else if (command.includes(RENAME_FILE)) {
      console.log("rename a file");
      const idx = command.indexOf(" to ");
      const oldPath = command.substring(RENAME_FILE.length + 1, idx);
      const newPath = command.substring(idx + 4);
      renameFile(oldPath, newPath);
    } else if (command.includes(DELETE_FILE)) {
      const filePath = command.substring(DELETE_FILE.length + 1);
      deleteFile(filePath);
    } else {
      console.log(`Command not recognized: ${command}`);
    }
  });
  const watcher = fs.watch("./command.txt");

  //watcher
  for await (let event of watcher) {
    if (event.eventType === "change") {
      commandFilehandler.emit("change");
    }
  }
})();
