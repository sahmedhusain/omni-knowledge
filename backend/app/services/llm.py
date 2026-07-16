from typing import List, Dict
from backend.app.config import settings

class LLMService:
    """Service to coordinate RAG context building and answer generation."""

    @classmethod
    def generate_answer(cls, query: str, chunks: List[Dict]) -> str:
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
            
            response = client.chat.completions.create(
                model=settings.OPENAI_LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {query}"}
                ],
                temperature=0.0
            )
            return response.choices[0].message.content
            
        elif provider == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("Gemini API key is missing. Please configure GEMINI_API_KEY in .env.")
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Use model with system instructions
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_LLM_MODEL,
                system_instruction=system_instruction
            )
            
            prompt = f"Context:\n{context_str}\n\nQuestion: {query}"
            response = model.generate_content(prompt)
            return response.text
            
        else:
            raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")
