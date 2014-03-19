import psycopg2
from collections import defaultdict
import re
import mydb

words = re.compile(r'[ "#&\'()-,+/:;<>=?\.!"]')
def tokenize(s):
    s = s.upper()
    tokens = filter(lambda x: x, words.split(s))
    return tokens

class STree(object):
    """ A Suffix Tree. Initialize with an iterable containing (cdid, [token]) tuples.
    Takes a suffix and looks up all the cdids containing a token with that suffix.
    Returns two sets, one of exact matches ('foo' -> 'foo') and one of
    suffix matches ('foo' -> 'foobar').
    Used by the search functionality of the website.
    TODO: optimize this
    """
    def __init__(self, toks = None):
        self._children = defaultdict(STree)
        self._cdids = set()
        self._size = 0
        if toks:
            for cdid, tokens in toks:
                self._insert(cdid, tokens)

    def find(self, token):
        if not token:
            return (set(self._cdids), self._getall() - self._cdids)
        token = token.upper()
        if self._children.has_key(token[0]):
            return self._children[token[0]].find(token[1:])
        return (set(), set())

    def _getall(self):
        childCdids = set(self._cdids)
        for child in self._children.values():
            child._getall_fillset(childCdids)

        return childCdids

    def _getall_fillset(self, cdids):
        cdids |= self._cdids
        for child in self._children.values():
            child._getall_fillset(cdids)

    def _insert(self, cdid, tokens):
        for token in tokens:
            self._insone(cdid, token)
            self._size += 1

    def _insone(self, cdid, token):
        if not token:
            self._cdids.add(cdid)
        else:
            token = token.upper()
            self._children[token[0]]._insone(cdid, token[1:])

class TokenMatcher(object):
    """Singleton used by the the back-end for search functionality.
     Finds cdids matching the tokens given to match_tokens
    """
    def __init__(self, cdid_table):
        cdids = cdid_table.query.all()
        self._cdid_names = {cdid.cdid:cdid.name for cdid in cdids}
        tokenized = [(cdid, tokenize(name))
                     for cdid, name in self._cdid_names.items()]
        self._suffixtree = STree(tokenized)

    def match_tokens(self, tokens):
        """Find cdids with names that match the tokens.
           All tokens must be matched. Exact matches are prioritized
           over suffix matches.
        """
        if len(tokens) > 10:
            tokens = tokens[:10]
        if len(tokens) == 1 and tokens[0].upper() in self._cdid_names:
            return [(tokens[0], self._cdid_names[tokens[0]])]
            
        matches_by_token = [self._suffixtree.find(token) for token in tokens]
        all_matches_by_token = [a | b for a, b in matches_by_token]
        all_matches = reduce(lambda x, y: x & y, all_matches_by_token)

        # order the results by how many times a token was matched exactly
        exacts_matches_by_token = [a for a, _ in matches_by_token]
        def match_ordering(match):
            exact_match_count = sum(1 for matches in exacts_matches_by_token 
                                      if match in matches)
            return (exact_match_count, -len(self._cdid_names[match]))

        matches = sorted(all_matches, key=match_ordering, reverse=True)

        return [(cdid, self._cdid_names[cdid]) for cdid in matches]