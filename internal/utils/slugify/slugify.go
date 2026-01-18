package slugify

import (
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

func Slugify(str string) string {
	text := norm.NFD.String(str)

	builder := strings.Builder{}

	for _, r := range text {
		if unicode.Is(unicode.Mn, r) {
			continue
		}

		if unicode.IsLetter(r) || unicode.IsNumber(r) {
			builder.WriteRune(unicode.ToLower(r))
		} else {
			builder.WriteRune('_')
		}
	}

	out := regexp.MustCompile(`_+`).ReplaceAllString(builder.String(), "_")

	return strings.Trim(out, "_")
}
