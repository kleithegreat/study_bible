import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { ScrollArea } from "./components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import bibleData from './NASB.json';

type Verse = string;
type Chapter = Verse[];
type Book = {
  abbr: string;
  name: string;
  chapters: Chapter[];
};

type RelatedVerse = {
  reference: string;
  text: string;
};

const StudyBible: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<string>(Object.keys(bibleData)[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterContent, setChapterContent] = useState<Verse[]>([]);
  const [hoverVerse, setHoverVerse] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<{ verse: number; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(16);
  const [relatedVerses, setRelatedVerses] = useState<RelatedVerse[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(false);

  useEffect(() => {
    const loadChapterContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const book = (bibleData as Record<string, Book>)[selectedBook];
        if (!book) {
          throw new Error(`Book "${selectedBook}" not found`);
        }
        const chapters = book.chapters;
        if (!chapters[selectedChapter - 1]) {
          throw new Error(`Chapter ${selectedChapter} not found in ${book.name}`);
        }
        const chapterVerses = chapters[selectedChapter - 1];
        setChapterContent(chapterVerses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setChapterContent([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapterContent();
  }, [selectedBook, selectedChapter]);

  const handleBookChange = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setSelectedVerse(null);
    setRelatedVerses([]);
  };

  const handleVerseHover = (verse: number) => {
    setHoverVerse(verse);
  };

  const handleVerseClick = async (verse: number, content: string) => {
    if (selectedVerse && selectedVerse.verse === verse) {
      setSelectedVerse(null);
      setRelatedVerses([]);
    } else {
      setSelectedVerse({ verse, content });
      setIsLoadingRelated(true);
      setError(null);
      try {
        const bookData = (bibleData as Record<string, Book>)[selectedBook];
        const response = await fetch('http://localhost:5000/api/similar_verses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            book: bookData.name,
            chapter: selectedChapter,
            verse: verse,
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch related verses: ${errorText}`);
        }
        const data = await response.json();
        setRelatedVerses(data);
      } catch (err) {
        console.error('Error fetching related verses:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching related verses');
        setRelatedVerses([]);
      } finally {
        setIsLoadingRelated(false);
      }
    }
  };

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
  };

  const books = Object.keys(bibleData);
  const chapters = (bibleData as Record<string, Book>)[selectedBook]?.chapters.length || 0;

  return (
    <div className="flex h-screen p-4 gap-4">
      <div className="flex-1 flex flex-col">
        <div className="mb-4 flex space-x-4 items-center">
          <Select value={selectedBook} onValueChange={handleBookChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a book" />
            </SelectTrigger>
            <SelectContent>
              {books.map((book) => (
                <SelectItem key={book} value={book}>
                  {(bibleData as Record<string, Book>)[book].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedChapter.toString()} onValueChange={(value) => setSelectedChapter(parseInt(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a chapter" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(chapters)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 ml-4">
            <span>Font Size:</span>
            <Slider
              defaultValue={[16]}
              max={24}
              min={12}
              step={1}
              onValueChange={handleFontSizeChange}
              className="w-[100px]"
            />
            <span>{fontSize}px</span>
          </div>
        </div>
        
        <ScrollArea className="flex-1 w-full rounded-md border p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-justify" style={{ fontSize: `${fontSize}px` }}>
              {chapterContent.map((verse, index) => (
                <span 
                  key={index}
                  onMouseEnter={() => handleVerseHover(index + 1)}
                  onMouseLeave={() => setHoverVerse(null)}
                  onClick={() => handleVerseClick(index + 1, verse)}
                  className={`cursor-pointer inline ${hoverVerse === index + 1 ? 'bg-gray-100' : ''} ${selectedVerse?.verse === index + 1 ? 'bg-blue-200' : ''}`}
                >
                  <sup className="font-bold text-xs mr-1">{index + 1}</sup>
                  {verse + ' '}
                </span>
              ))}
            </p>
          )}
        </ScrollArea>
      </div>
      
      <div className="w-1/3 bg-gray-100 p-4 rounded-md flex flex-col h-full max-h-full">
        <Card className="flex-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>Related Verses</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {isLoadingRelated ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading related verses...
              </div>
            ) : selectedVerse ? (
              relatedVerses.length > 0 ? (
                <ScrollArea className="h-full">
                  {relatedVerses.map((verse, index) => (
                    <div key={index} className="mb-4">
                      <p className="font-semibold">{verse.reference}</p>
                      <p>{verse.text}</p>
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <p>No related verses found.</p>
              )
            ) : (
              <p>Click a verse to see related passages</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudyBible;