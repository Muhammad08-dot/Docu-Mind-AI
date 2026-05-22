#!/usr/bin/env python3
"""
DocuMind AI - RAG Pipeline Test Script
Run: python scripts/test_rag.py

This script demonstrates and tests the full RAG pipeline:
1. Document ingestion
2. Hybrid search retrieval
3. LLM generation
4. RAG evaluation
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

# Initialize console
console = Console()


def print_header():
    console.print(Panel.fit(
        "[bold blue]DocuMind AI[/bold blue] - RAG Pipeline Test",
        subtitle="Enterprise Multilingual RAG Workspace"
    ))
    console.print()


def test_document_processing():
    """Test document processing pipeline"""
    console.print("[bold cyan]1. Testing Document Processing Pipeline[/bold cyan]")
    
    from services.document_processor import document_processor
    
    # Test text detection
    test_texts = [
        ("Hello, this is an English document.", "en"),
        ("یہ ایک اردو دستاویز ہے۔", "ur"),
        ("This has both English and اردو text.", "mixed"),
    ]
    
    table = Table(title="Language Detection")
    table.add_column("Text", style="dim")
    table.add_column("Detected", style="cyan")
    table.add_column("Expected", style="green")
    table.add_column("✓", style="bold")
    
    for text, expected in test_texts:
        detected = document_processor.detect_language(text)
        is_correct = "✓" if detected == expected else "✗"
        table.add_row(text[:40] + "...", detected, expected, is_correct)
    
    console.print(table)
    console.print()


def test_vector_store():
    """Test vector store operations"""
    console.print("[bold cyan]2. Testing Vector Store[/bold cyan]")
    
    from services.vector_store import get_vector_store
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Initializing vector store...", total=None)
        
        try:
            store = get_vector_store()
            progress.update(task, description="[green]Vector store initialized!")
            console.print(f"  → Using: {store.__class__.__name__}")
            console.print(f"  → Embedding model: {store.embedding_model}")
            console.print(f"  → Dimension: {store.dimension}")
        except Exception as e:
            progress.update(task, description=f"[red]Error: {e}")
    
    console.print()


def test_retrieval():
    """Test hybrid retrieval"""
    console.print("[bold cyan]3. Testing Hybrid Retrieval[/bold cyan]")
    
    # Mock some test documents
    test_docs = [
        {
            "chunk_id": "test-1",
            "doc_id": "doc-1",
            "content": "The annual leave policy allows employees to take 20 days of paid vacation per year.",
            "page_number": 1,
            "filename": "HR_Policy.pdf"
        },
        {
            "chunk_id": "test-2",
            "doc_id": "doc-1",
            "content": "Sick leave is separate from annual leave and provides 12 days per year.",
            "page_number": 2,
            "filename": "HR_Policy.pdf"
        },
        {
            "chunk_id": "test-3",
            "doc_id": "doc-2",
            "content": "The Transformer architecture uses self-attention mechanisms to process sequences.",
            "page_number": 1,
            "filename": "ML_Paper.pdf"
        },
    ]
    
    from services.retriever import retriever
    
    # Build BM25 index with test docs
    retriever.build_bm25_index(test_docs)
    
    # Test queries
    test_queries = [
        "What is the annual leave policy?",
        "How many sick days do I get?",
        "Explain transformer architecture",
    ]
    
    for query in test_queries:
        console.print(f"\n  [bold]Query:[/bold] {query}")
        
        # BM25 search
        bm25_results = retriever.bm25_search(query, top_k=2)
        console.print(f"  [dim]BM25 results:[/dim] {len(bm25_results)}")
        
        for score, doc in bm25_results[:2]:
            console.print(f"    • {doc['content'][:60]}... [dim](score: {score:.2f})[/dim]")
    
    console.print()


def test_llm_generation():
    """Test LLM generation with guardrails"""
    console.print("[bold cyan]4. Testing LLM Generation[/bold cyan]")
    
    from config import settings
    
    console.print(f"  → Provider: {settings.LLM_PROVIDER}")
    console.print(f"  → Model: {settings.OPENAI_MODEL if settings.LLM_PROVIDER == 'openai' else settings.OLLAMA_MODEL}")
    console.print(f"  → Temperature: {settings.LLM_TEMPERATURE}")
    
    # Skip actual generation in test mode (requires API key)
    if not settings.OPENAI_API_KEY and settings.LLM_PROVIDER == "openai":
        console.print("  [yellow]⚠ Skipping generation test (no API key)[/yellow]")
    else:
        console.print("  [green]✓ LLM service configured[/green]")
    
    console.print()


def test_rag_evaluation():
    """Test RAG evaluation metrics"""
    console.print("[bold cyan]5. Testing RAG Evaluation[/bold cyan]")
    
    from services.rag_evaluator import rag_evaluator
    
    # Test case
    test_query = "What is the annual leave policy?"
    test_context = "Annual leave policy: Employees receive 20 days of paid vacation per year. Additional days may be earned based on tenure."
    test_answer = "According to the HR policy, employees are entitled to 20 days of paid annual leave per year."
    test_chunks = [
        {"chunk_id": "1", "content": "Annual leave policy: Employees receive 20 days of paid vacation."},
        {"chunk_id": "2", "content": "Sick leave is separate and provides 12 days per year."},
    ]
    
    result = rag_evaluator.evaluate_full(
        query=test_query,
        answer=test_answer,
        retrieved_chunks=test_chunks,
        context=test_context
    )
    
    table = Table(title="RAG Evaluation Results")
    table.add_column("Metric", style="cyan")
    table.add_column("Score", style="bold")
    table.add_column("Status")
    
    def get_status(score):
        if score >= 0.9:
            return "[green]Excellent[/green]"
        elif score >= 0.7:
            return "[yellow]Good[/yellow]"
        else:
            return "[red]Needs Improvement[/red]"
    
    table.add_row(
        "Context Precision",
        f"{result['context_precision']['score']:.1%}",
        get_status(result['context_precision']['score'])
    )
    table.add_row(
        "Faithfulness",
        f"{result['faithfulness']['score']:.1%}",
        get_status(result['faithfulness']['score'])
    )
    table.add_row(
        "Answer Relevance",
        f"{result['answer_relevance']['score']:.1%}",
        get_status(result['answer_relevance']['score'])
    )
    table.add_row(
        "[bold]Overall Score[/bold]",
        f"[bold]{result['overall_score']:.1%}[/bold]",
        "[green]PASS[/green]" if result['passed_threshold'] else "[red]FAIL[/red]"
    )
    
    console.print(table)
    console.print()


def main():
    print_header()
    
    start_time = time.time()
    
    try:
        test_document_processing()
        test_vector_store()
        test_retrieval()
        test_llm_generation()
        test_rag_evaluation()
        
        elapsed = time.time() - start_time
        console.print(Panel.fit(
            f"[green]All tests completed in {elapsed:.2f}s[/green]",
            title="✓ Success"
        ))
        
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
