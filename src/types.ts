interface Stats {
    blanks: number;
    blobs: {};
    code: number;
    comments: number;
}

interface Report {
    name: string;
    stats: Stats;
}

interface LanguageStats {
    blanks: number;
    children: { [key: string]: Report[] };
    code: number;
    comments: number;
    inaccurate: boolean;
    reports: Report[];
}

export interface TokeiOutput {
    [language: string]: LanguageStats;
}