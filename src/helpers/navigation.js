import { useStaticQuery, graphql } from 'gatsby';

export const usePages = () => {
    const {
        site: { siteMetadata: { pages } },
        imageSharp: { fluid: logo }
    } = useStaticQuery(graphql`
        query getPages {
            site {
                siteMetadata {
                    pages {
                        name
                        link
                        isExpandable
                        childPages {
                            name
                            link
                        }
                    }
                }
            }
            imageSharp(original: {src: {regex: "/logo/"}}) {
                fluid(maxWidth: 300) {
                    ...GatsbyImageSharpFluid
                }
            }
        }
    `);

    return { pages, logo };
}
