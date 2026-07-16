import json
from pathlib import Path
from typing import Union

class DocumentParser:
    """Service to parse files and extract clean plain text."""
    
    @staticmethod
    def parse(file_path: Union[str, Path]) -> str:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        suffix = path.suffix.lower()
        
        if suffix in [".txt", ".md"]:
            return DocumentParser._parse_text_file(path)
        elif suffix == ".json":
            return DocumentParser._parse_json_file(path)
        else:
            # Fallback to plain text read for other extensions
            try:
                return DocumentParser._parse_text_file(path)
            except Exception as e:
                raise ValueError(f"Unsupported file format: {suffix}. Error: {str(e)}")

    @staticmethod
    def _parse_text_file(path: Path) -> str:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()

    @staticmethod
    def _parse_json_file(path: Path) -> str:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            data = json.load(f)
            
        # If it's a list of QA pairs or dict of fields, flatten to text
        if isinstance(data, list):
            lines = []
            for item in data:
                if isinstance(item, dict):
                    # Try to extract keys like 'question', 'answer', 'title', 'content'
                    q = item.get("question") or item.get("q") or item.get("title")
                    a = item.get("answer") or item.get("a") or item.get("content") or item.get("text")
                    if q and a:
                        lines.append(f"Question: {q}\nAnswer: {a}\n")
                    else:
                        lines.append(json.dumps(item, indent=2))
                else:
                    lines.append(str(item))
            return "\n".join(lines)
            
        elif isinstance(data, dict):
            # Check for common RAG datasets
            lines = []
            for k, v in data.items():
                if isinstance(v, (dict, list)):
                    lines.append(f"{k}:\n{json.dumps(v, indent=2)}")
                else:
                    lines.append(f"{k}: {v}")
            return "\n".join(lines)
            
        return json.dumps(data, indent=2)
