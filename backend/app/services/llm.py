from typing import List, Dict
from backend.app.config import settings

class LLMService:
    """Service to coordinate RAG context building and answer generation."""

    @classmethod
    def generate_answer(cls, query: str, chunks: List[Dict], history: List[Dict] = None) -> str:
        """Assembles prompt and queries LLM using current settings."""
        if not chunks:
            return "I couldn't find any relevant documents to answer this question. Please upload resources first."

        # Build context prompt blocks
        context_blocks = []
        for i, chunk in enumerate(chunks, 1):
            context_blocks.append(
                f"Source [{i}]: {chunk['filename']}\n"
                f"Content: {chunk['content']}\n"
                f"---"
            )
            
        context_str = "\n".join(context_blocks)
        
        system_instruction = (
            "You are a helpful knowledge assistant. Your task is to answer the user's question concisely based ONLY on the provided Sources. "
            "In your answer, you must cite which source you are referencing by suffixing statements with their corresponding Source index in brackets, e.g., [1] or [2]. "
            "Do not cite sources if the facts are not derived directly from them. "
            "If the provided context does not contain enough information to answer the question, state: "
            "'I cannot answer this question because the relevant information is not in the uploaded documents.'"
        )

        provider = settings.LLM_PROVIDER
        
        if provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OpenAI API key is missing. Please configure OPENAI_API_KEY in .env.")
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            messages = [{"role": "system", "content": system_instruction}]
            if history:
                for msg in history:
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            messages.append({"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {query}"})
            
            response = client.chat.completions.create(
                model=settings.OPENAI_LLM_MODEL,
                messages=messages,
                temperature=0.0
            )
            return response.choices[0].message.content
            
        elif provider == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("Gemini API key is missing. Please configure GEMINI_API_KEY in .env.")
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_LLM_MODEL,
                system_instruction=system_instruction
            )
            
            # Format history directly into prompt for robust parsing
            prompt_lines = []
            if history:
                prompt_lines.append("Previous Conversation History:")
                for msg in history:
                    role_label = "User" if msg.get("role") == "user" else "Assistant"
                    prompt_lines.append(f"{role_label}: {msg.get('content', '')}")
                prompt_lines.append("\n--- Current Context and Question ---")
                
            prompt_lines.append(f"Context:\n{context_str}\n\nQuestion: {query}")
            prompt = "\n".join(prompt_lines)
            
            response = model.generate_content(prompt)
            return response.text
            
        elif provider == "ollama":
            from openai import OpenAI
            client = OpenAI(
                base_url=settings.OLLAMA_BASE_URL,
                api_key="ollama"
            )
            messages = [{"role": "system", "content": system_instruction}]
            if history:
                for msg in history:
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            messages.append({"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {query}"})
            
            response = client.chat.completions.create(
                model=settings.OLLAMA_LLM_MODEL,
                messages=messages,
                temperature=0.0
            )
            return response.choices[0].message.content
            
        else:
            raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")
