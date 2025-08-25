import { useEffect, useRef, useState } from "react";
import { Button, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function Index() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hello! I am your AI chat. Type something below." }
  ]);
  const flatListRef = useRef<FlatList>(null);

  async function sendMessage() {
  if (!input.trim()) return;

  const userMsg: Message = { role: "user", text: input };
  setMessages(prev => [...prev, userMsg]);
  setInput("");

  try {
    const res = await fetch("http://192.168.0.170:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg.text, history: messages })
    });

    const data = await res.json();
    setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
  } catch (e) {
    setMessages(prev => [...prev, { role: "assistant", text: "API error" }]);
  }
}

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        style={styles.chatBox}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingBottom: 100 }} // make space for input & tab bar
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.role === "user" ? styles.userRow : styles.aiRow]}>
            <Text style={item.role === "user" ? styles.userMsg : styles.aiMsg}>{item.text}</Text>
          </View>
        )}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={-50}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            placeholderTextColor="#999"
          />
          <Button title="Send" onPress={sendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TAB_BAR_HEIGHT = 60; // approximate height of bottom tab bar

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", paddingHorizontal: 16, paddingTop: 16 },
  chatBox: { flex: 1 },
  messageRow: { marginVertical: 6, maxWidth: "70%", padding: 12, borderRadius: 16 },
  userRow: { backgroundColor: "#1f1f1f", alignSelf: "flex-end" },
  aiRow: { backgroundColor: "#2a2a2a", alignSelf: "flex-start" },
  userMsg: { color: "#fff" },
  aiMsg: { color: "#d1d1d1" },
  inputRow: { 
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: TAB_BAR_HEIGHT, // move input above tab bar
  },
  input: { 
    flex: 1, 
    borderWidth: 0, 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: "#1f1f1f", 
    color: "#fff", 
    marginRight: 8 
  }
});
