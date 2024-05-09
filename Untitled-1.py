def decode(file_content):
    words_map = {}
    for line in file_content.strip().split('\n'):
        number, word = line.split()
        words_map[int(number)] = word
    
    pattern = [
        [1],
        [4, 5, 6]
    ]
    
    decoded_message = []
    for line in pattern:
        for number in line:
            if number in words_map:
                decoded_message.append(words_map[number])
    
    return " ".join(decoded_message)

file_content = """3 love
6 computers
2 dogs
4 cats
1 I
5 you"""

print(decode(file_content))
