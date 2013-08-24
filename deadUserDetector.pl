#!/usr/bin/perl
use CGI;
use Data::Dumper;
use DBI;

my $dbh = DBI->connect("dbi:SQLite:condition.sqlite","","");

my $sth = $dbh->prepare("SELECT userid,lastseen FROM userids WHERE lastseen<(datetime('now','-15 seconds'));");
my $rh = $sth->execute();

while(@array = $sth->fetchrow_array()) {
    print "UserID $array[0] appears to be dead (last seen $array[1])\n";
}


