import re
from typing import List, Dict

class Chunker:
    """Service to split raw text into semantic chunks of target token size."""
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
        if not text:
            return []
            
        # Approximate 1 token = 4 characters
        char_size = chunk_size * 4
        char_overlap = overlap * 4
        
        # Split text into paragraphs first (using double newlines)
        paragraphs = re.split(r'\n\s*\n', text)
        chunks = []
        current_chunk = []
        current_length = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            para_len = len(para)
            
            # If a single paragraph is larger than our target chunk size, split it into sentences
            if para_len > char_size:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    
                    sent_len = len(sentence)
                    
                    if current_length + sent_len > char_size and current_chunk:
                        # Save current chunk and start a new one with overlap
                        chunk_text = " ".join(current_chunk)
                        chunks.append(chunk_text)
                        
                        # Handle overlap (keep last few sentences)
                        overlap_text = []
                        overlap_len = 0
                        for s in reversed(current_chunk):
                            if overlap_len + len(s) < char_overlap:
                                overlap_text.insert(0, s)
                                overlap_len += len(s)
                            else:
                                break
                        current_chunk = overlap_text
                        current_length = sum(len(s) for s in current_chunk)
                        
                    current_chunk.append(sentence)
                    current_length += sent_len
            else:
                if current_length + para_len > char_size and current_chunk:
                    chunk_text = "\n\n".join(current_chunk)
                    chunks.append(chunk_text)
                    
                    # Handle overlap (keep last paragraph if it fits within overlap limit)
                    overlap_text = []
                    overlap_len = 0
                    for p in reversed(current_chunk):
                        if overlap_len + len(p) < char_overlap:
                            overlap_text.insert(0, p)
                            overlap_len += len(p)
                        else:
                            break
                    current_chunk = overlap_text
                    current_length = sum(len(p) for p in current_chunk)
                    
                current_chunk.append(para)
                current_length += para_len
                
        if current_chunk:
            join_str = "\n\n" if len(current_chunk) > 1 else " "
            chunks.append(join_str.join(current_chunk))
            
        return chunks
