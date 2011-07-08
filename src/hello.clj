(ns hello-world
    (:use compojure.core, ring.adapter.jetty, incanter.core, incanter.stats, incanter.charts,
	  incanter.io ,hiccup.core)
    (:require [compojure.route :as route] [clojure.contrib.string :as str])
    (:import (java.io ByteArrayOutputStream
		      ByteArrayInputStream),
	     GraphViz))



(defn to-dot [line]
  (let [linevec (str/split #"\t" line)
       nodename (first linevec)
       idv (map vector (iterate inc 0) (next linevec))]
       (doseq [[index value] idv]
	      (if (not= (Float/parseFloat value) 0.0) 
		  (println nodename "->" index)))))


;; Pass a map as the first argument to be 
;; set as attributes of the element
(defn html-doc 
  [title & body] 
  (html 
       [:div 
	[:h2 
	 [:a {:href "/"} 
          "Generate a normal sample"]]]
       body)) 

(defn graph-viz
  [id]
  (with-open [fr (java.io.FileReader. "data/Mike - FCM Cork Harbour.csv")
	     br (java.io.BufferedReader. fr)]
	     (doseq [line (next (line-seq br))] (to-dot line)))
  (let [data (read-dataset "data/Mike - FCM Cork Harbour.csv" :header true)
       gv (new GraphViz)]
       (.addln gv (.start_graph gv))	
       (.addln gv "A -> B;")
       (.addln gv "A -> C;")
       (.addln gv (.end_graph gv))
       (let [graph (.getGraph gv (.getDotSource gv) "gif")
	    in-stream (do
			  (new ByteArrayInputStream graph))]
			  {:status 200	 
			  :headers {"Content-Type" "image/gif"}
			  :body in-stream})))


;; define routes
(defroutes webservice
  (GET "/:doi" [id] (graph-viz id) ))

(run-jetty webservice {:port 8080})
  