import io

p = 'src/components/blog/prose.css'
s = io.open(p, encoding='utf-8').read()

anchor = '''.blog-prose .blog-figure figcaption {'''

add = '''/* Diagrams carry more detail than a paragraph, so on a wide screen they are
   allowed out of the prose column. The text column stays at its reading width;
   only the figure breaks out, and it never exceeds the viewport. Below this
   breakpoint the figure behaves exactly as before. */
@media (min-width: 1120px) {
  .blog-prose .blog-figure {
    width: min(980px, 92vw);
    margin-left: 50%;
    transform: translateX(-50%);
  }
}

.blog-prose .blog-figure figcaption {'''

assert anchor in s
s = s.replace(anchor, add, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('ok')
