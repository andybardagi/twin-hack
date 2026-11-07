export interface SessionReader {
  read(headers: Headers): Promise<{ userId: string } | null>;
}
