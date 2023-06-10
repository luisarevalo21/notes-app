import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Split from "react-split";
import "./App.css";
import { onSnapshot, addDoc, doc, deleteDoc, setDoc } from "firebase/firestore";
import { notesCollection, db } from "./firebase";
export default function App() {
  const [notes, setNotes] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState("");
  const [tempNoteText, setTempNoteText] = useState("");

  console.log("temp note text is:", tempNoteText);
  const currentNote = notes.find(note => note.id === currentNoteId) || notes[0];
  const sortedNotes = notes.sort((a, b) => {
    return b.updatedAt - a.updatedAt;
  });
  // console.log("notes is", notes);
  useEffect(() => {
    const unsubscribe = onSnapshot(notesCollection, function (snapshot) {
      //sync up local notes array with snapshot data
      const notesArray = snapshot.docs.map(doc => {
        return { ...doc.data(), id: doc.id };
      });

      // console.log(notesArray);
      setNotes(notesArray);
    });

    return unsubscribe;
    // localStorage.setItem("notes", JSON.stringify(notes));
  }, []);

  useEffect(() => {
    if (!currentNoteId) {
      setCurrentNoteId(notes[0]?.id);
    }
  }, [notes]);

  useEffect(() => {
    if (currentNote) {
      setTempNoteText(currentNote.body);
    }
  }, [currentNote]);

  //debounce in firestore
  //delays by 500millseconds sending to database to limit post requests
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentNote && tempNoteText !== currentNote.body) updateNote(tempNoteText);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [tempNoteText]);

  async function createNewNote() {
    const newNote = {
      // id: nanoid(),
      body: "# Type your markdown note's title here",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newNoteRef = await addDoc(notesCollection, newNote);
    setCurrentNoteId(newNoteRef.id);

    // setNotes(prevNotes => {
    //   return [newNote, ...prevNotes];
    // });

    // setCurrentNoteId(newNote.id);
  }

  async function updateNote(text) {
    // setNotes(oldNotes => {
    //   const data = [];

    //   oldNotes.forEach(note => {
    //     if (note.id === currentNoteId) {
    //       data.unshift({ ...note, body: text });
    //     } else {
    //       data.push(note);
    //     }
    //   });
    //   return data;
    // });
    const docRef = doc(db, "notes", currentNoteId);
    await setDoc(docRef, { body: text, updatedAt: Date.now() }, { merge: true });
  }

  async function deleteNote(noteId) {
    // setNotes(prevNotes => {
    //   return prevNotes.filter(note => note.id !== noteId);
    // });

    const docRef = doc(db, "notes", noteId);
    await deleteDoc(docRef);
  }

  // function findCurrentNote() {
  //   return (
  //     notes.find(note => {
  //       return note.id === currentNoteId;
  //     }) || notes[0]
  //   );
  // }
  return (
    <main>
      {notes.length > 0 ? (
        <Split sizes={[30, 70]} direction="horizontal" className="split">
          <Sidebar
            notes={sortedNotes}
            currentNote={currentNote}
            setCurrentNoteId={setCurrentNoteId}
            newNote={createNewNote}
            deleteNote={deleteNote}
          />
          <Editor tempNoteText={tempNoteText} updateTempNoteText={setTempNoteText} />
        </Split>
      ) : (
        <div className="no-notes">
          <h1>You have no notes</h1>
          <button className="first-note" onClick={createNewNote}>
            Create one now
          </button>
        </div>
      )}
    </main>
  );
}
//currentNoteId && notes.length > 0 &&
